export type JwtPayload = {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    iat: number;
    exp: number;
};
