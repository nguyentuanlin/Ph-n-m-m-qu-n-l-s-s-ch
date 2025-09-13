import React from 'react';
type ProtectedLinkProps = {
    roles: string[];
    currentRole: string;
    to: string;
    children: React.ReactNode;
};

const ProtectedLink: React.FC<ProtectedLinkProps> = ({ roles, currentRole, to, children }) => {
    if (!roles.includes(currentRole)) {
        return null;
    }

    return <a href={to}>{children}</a>;
};

export default ProtectedLink;