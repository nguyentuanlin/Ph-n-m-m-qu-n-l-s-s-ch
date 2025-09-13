const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Middleware để tự động log các thao tác API
 */
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Lưu trữ dữ liệu gốc của request
    const originalBody = req.body;
    const originalParams = req.params;
    const originalQuery = req.query;
    
    // Override res.send để capture response
    res.send = function(data) {
      // Tính thời gian thực hiện
      const executionTime = Date.now() - startTime;
      
      // Log audit sau khi response được gửi
      setImmediate(async () => {
        try {
          await logAuditEvent({
            req,
            res,
            originalBody,
            originalParams,
            originalQuery,
            executionTime,
            responseData: data,
            options
          });
        } catch (error) {
          console.error('Error logging audit event:', error);
        }
      });
      
      // Gọi original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Hàm tạo audit log
 */
async function logAuditEvent({
  req,
  res,
  originalBody,
  originalParams,
  originalQuery,
  executionTime,
  responseData,
  options
}) {
  try {
    // Bỏ qua các route không cần log
    if (shouldSkipLogging(req, options)) {
      return;
    }
    
    // Lấy thông tin user từ token
    const user = req.user || null;
    if (!user) {
      return; // Không log nếu không có user
    }
    
    // Xác định action và resource
    let action, resource, resourceId, resourceName;
    try {
      const result = determineActionAndResource(req);
      action = result.action;
      resource = result.resource;
      resourceId = result.resourceId;
      resourceName = result.resourceName;
    } catch (error) {
      console.error('❌ Error in determineActionAndResource:', error);
      action = 'VIEW';
      resource = 'SYSTEM';
      resourceId = null;
      resourceName = null;
    }
    
    // Tạo description
    const description = createDescription(req, action, resource, resourceName);
    
    // Lấy old data và new data
    const { oldData, newData, updatedResourceId } = await getDataChanges(req, action, resource, resourceId, responseData);
    
    // Cập nhật resourceId nếu có
    if (updatedResourceId) {
      resourceId = updatedResourceId;
    }
    
    // Xác định status
    const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED';
    
    // Tạo audit log data
    const auditData = {
      user: user._id,
      userInfo: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department?.name || null,
        unit: user.unit?.name || null
      },
      action,
      resource,
      resourceId,
      resourceName,
      description,
      oldData,
      newData,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status,
      errorMessage: status === 'FAILED' ? getErrorMessage(responseData) : null,
      executionTime,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        params: originalParams,
        query: originalQuery
      }
    };
    
    // Lưu audit log
    await AuditLog.createLog(auditData);
    
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
}

/**
 * Kiểm tra xem có nên bỏ qua logging không
 */
function shouldSkipLogging(req, options) {
  const skipPaths = [
    '/api/health',
    '/api-docs',
    '/favicon.ico'
  ];
  
  const skipMethods = ['OPTIONS'];
  
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return true;
  }
  
  if (skipMethods.includes(req.method)) {
    return true;
  }
  
  if (options.skipPaths && options.skipPaths.some(path => req.path.startsWith(path))) {
    return true;
  }
  
  return false;
}

/**
 * Xác định action và resource từ request
 */
function determineActionAndResource(req) {
  const { method, route } = req;
  const path = req.originalUrl || req.path;
  let action = 'VIEW';
  let resource = 'SYSTEM';
  let resourceId = null;
  let resourceName = null;
  
  // Xác định action dựa trên HTTP method
  switch (method) {
    case 'POST':
      action = 'CREATE';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'UPDATE';
      break;
    case 'DELETE':
      action = 'DELETE';
      break;
    case 'GET':
      action = 'VIEW';
      break;
  }
  
  // Xác định resource dựa trên path
  if (path.includes('/auth/login')) {
    action = 'LOGIN';
    resource = 'AUTH';
  } else if (path.includes('/auth/logout')) {
    action = 'LOGOUT';
    resource = 'AUTH';
  } else if (path.includes('/users') || path.includes('/api/users')) {
    resource = 'USER';
    resourceId = req.params.id;
  } else if (path.includes('/departments') || path.includes('/api/departments')) {
    resource = 'DEPARTMENT';
    resourceId = req.params.id;
  } else if (path.includes('/units') || path.includes('/api/units')) {
    resource = 'UNIT';
    resourceId = req.params.id;
  } else if (path.includes('/ranks') || path.includes('/api/ranks')) {
    resource = 'RANK';
    resourceId = req.params.id;
  } else if (path.includes('/positions') || path.includes('/api/positions')) {
    resource = 'POSITION';
    resourceId = req.params.id;
  } else if (path.includes('/books') || path.includes('/api/books')) {
    resource = 'BOOK';
    resourceId = req.params.id;
  } else if (path.includes('/entries') || path.includes('/api/entries')) {
    resource = 'BOOK_ENTRY';
    resourceId = req.params.id;
  } else if (path.includes('/notifications') || path.includes('/api/notifications')) {
    resource = 'NOTIFICATION';
    resourceId = req.params.id;
  } else if (path.includes('/reports') || path.includes('/api/reports')) {
    resource = 'REPORT';
    resourceId = req.params.id;
  } else if (path.includes('/task-assignments') || path.includes('/api/task-assignments')) {
    resource = 'TASK_ASSIGNMENT';
    resourceId = req.params.id;
  }
  
  return { action, resource, resourceId, resourceName };
}

/**
 * Tạo mô tả cho audit log
 */
function createDescription(req, action, resource, resourceName) {
  const { method, path } = req;
  const resourceNames = {
    'USER': 'người dùng',
    'DEPARTMENT': 'phòng ban',
    'UNIT': 'đơn vị',
    'RANK': 'cấp bậc',
    'POSITION': 'chức vụ',
    'BOOK': 'sổ sách',
    'BOOK_ENTRY': 'bản ghi sổ sách',
    'NOTIFICATION': 'thông báo',
    'TASK_ASSIGNMENT': 'giao việc',
    'REPORT': 'báo cáo',
    'AUTH': 'xác thực',
    'SYSTEM': 'hệ thống'
  };
  
  const actionNames = {
    'LOGIN': 'đăng nhập',
    'LOGOUT': 'đăng xuất',
    'CREATE': 'tạo mới',
    'UPDATE': 'cập nhật',
    'DELETE': 'xóa',
    'VIEW': 'xem',
    'ASSIGN': 'phân công',
    'UNASSIGN': 'hủy phân công',
    'APPROVE': 'phê duyệt',
    'REJECT': 'từ chối',
    'EXPORT': 'xuất dữ liệu',
    'IMPORT': 'nhập dữ liệu'
  };
  
  const resourceName_vi = resourceNames[resource] || resource.toLowerCase();
  const actionName_vi = actionNames[action] || action.toLowerCase();
  
  if (action === 'LOGIN') {
    return `Đăng nhập vào hệ thống`;
  } else if (action === 'LOGOUT') {
    return `Đăng xuất khỏi hệ thống`;
  } else {
    return `${actionName_vi} ${resourceName_vi}${resourceName ? ` "${resourceName}"` : ''}`;
  }
}

/**
 * Lấy dữ liệu thay đổi (old data và new data)
 */
async function getDataChanges(req, action, resource, resourceId, responseData) {
  let oldData = null;
  let newData = null;
  let updatedResourceId = resourceId;
  
  try {
    // Lấy new data từ request body
    if (['CREATE', 'UPDATE'].includes(action) && req.body) {
      newData = { ...req.body };
      // Loại bỏ password khỏi log
      if (newData.password) {
        delete newData.password;
      }
    }
    
    // Với CREATE, nếu có response data chứa ID, cập nhật resourceId
    if (action === 'CREATE' && responseData) {
      try {
        const parsedResponse = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        if (parsedResponse && parsedResponse.data && parsedResponse.data._id) {
          updatedResourceId = parsedResponse.data._id;
        } else if (parsedResponse && parsedResponse._id) {
          updatedResourceId = parsedResponse._id;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Lấy old data cho UPDATE và DELETE
    if (['UPDATE', 'DELETE'].includes(action) && updatedResourceId) {
      const Model = getModelByResource(resource);
      if (Model) {
        try {
          const oldRecord = await Model.findById(updatedResourceId).lean();
          if (oldRecord) {
            oldData = { ...oldRecord };
            // Loại bỏ password khỏi log
            if (oldData.password) {
              delete oldData.password;
            }
          }
        } catch (error) {
          console.error('Error fetching old data:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error getting data changes:', error);
  }
  
  return { oldData, newData, updatedResourceId };
}

/**
 * Lấy model dựa trên resource
 */
function getModelByResource(resource) {
  const models = {
    'USER': require('../models/User'),
    'DEPARTMENT': require('../models/Department'),
    'UNIT': require('../models/Unit'),
    'RANK': require('../models/Rank'),
    'POSITION': require('../models/Position'),
    'BOOK': require('../models/Book'),
    'BOOK_ENTRY': require('../models/BookEntry'),
    'NOTIFICATION': require('../models/Notification'),
    'TASK_ASSIGNMENT': require('../models/TaskAssignment')
  };
  
  return models[resource] || null;
}

/**
 * Lấy IP address của client
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for'] ||
         'Unknown';
}

/**
 * Lấy thông báo lỗi từ response
 */
function getErrorMessage(responseData) {
  try {
    if (typeof responseData === 'string') {
      const parsed = JSON.parse(responseData);
      return parsed.message || parsed.error || 'Unknown error';
    }
    if (typeof responseData === 'object') {
      return responseData.message || responseData.error || 'Unknown error';
    }
    return 'Unknown error';
  } catch (error) {
    return 'Unknown error';
  }
}

module.exports = auditLogger;
