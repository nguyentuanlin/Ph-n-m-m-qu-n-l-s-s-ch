import axios, {AxiosInstance} from "axios";
import { jwtDecode  } from "jwt-decode";
const API_BASE_URL = "http://localhost:5001/api";

export const majorService: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface Major {
    id: number;
    majorCode: string;
    majorName: string;
}

export const getMajors = async (token: string): Promise<Major[]> => {
    try {
        const response = await majorService.get<Major[]>("/majors", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch courses");
    }
};

export const createMajor = async (token: string, major: Major): Promise<Major> => {
    try {
        const response = await majorService.post<Major>("/majors", major, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create major");
    }
};

export const updateMajor = async (token: string, majorId: string, major: Major): Promise<Major> => {
    try {
        const response = await majorService.put<Major>(`/majors/${majorId}`, major, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update major");
    }
};

export const deleteMajor = async (token: string, majorId: string): Promise<void> => {
    try {
        await majorService.delete(`/majors/${majorId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete major");
    }
};
