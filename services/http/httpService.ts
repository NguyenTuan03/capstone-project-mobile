import http from "@/services/http/interceptor";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export const get = async <T = unknown>(
  url: string,
  option: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  const res: AxiosResponse<T> = await http.get(url, option);
  return res;
};

export const post = async <T = any>(
  url: string,
  data: unknown = {},
  option: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  try {
    const isFormData = data && typeof data === "object" && "_parts" in data;

    if (isFormData && option.headers) {
      const { "Content-Type": _, ...restHeaders } = option.headers as any;
      option.headers = restHeaders;
    }

    const res: AxiosResponse<T> = await http.post(url, data, option);
    return res;
  } catch (err) {
    throw err;
  }
};

export const put = async <T = unknown>(
  url: string,
  data: unknown = {},
  option: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  const res: AxiosResponse<T> = await http.put(url, data, option);
  return res;
};

export const remove = async <T = unknown>(
  url: string,
  option: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  const res: AxiosResponse<T> = await http.delete(url, option);
  return res;
};

export const patch = async <T = unknown>(
  url: string,
  data: unknown = {},
  option: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  try {
    const res: AxiosResponse<T> = await http.patch(url, data, option);
    return res;
  } catch (err) {
    throw err;
  }
};

export default http;
