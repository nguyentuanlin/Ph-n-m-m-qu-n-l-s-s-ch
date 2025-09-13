import axios, {AxiosInstance} from "axios";
import { jwtDecode  } from "jwt-decode";
const API_BASE_URL = "http://localhost:5001/api";

export const courseService: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface Course {
    id: number;
    name: string;
    description: string;
    price: number;
}

export const getCourses = async (token: string): Promise<Course[]> => {
    try {
        const response = await courseService.get<Course[]>("/courses", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch courses");
    }
};