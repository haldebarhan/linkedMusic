import Axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const axiosInstance = Axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    return error;
  }
);

const get = async (
  url: string,
  reqOptions?: AxiosRequestConfig
): Promise<AxiosResponse<any>> => {
  return await axiosInstance
    .get(url, reqOptions)
    .then((response: any) => response);
};

const post = async (
  url: any,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<any>> => {
  return await axiosInstance.post(url, data, config);
};

const put = (
  url: any,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<any>> => {
  return axiosInstance.put(url, data, config);
};

const del = (
  url: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<any>> => {
  return axiosInstance.delete(url, config);
};

const axiosFetch = { _get: get, _post: post, _put: put, _delete: del };

export default axiosFetch;
