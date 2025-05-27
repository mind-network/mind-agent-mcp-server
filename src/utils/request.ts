import axios from "axios";

const request = axios.create({
  baseURL: "https://mcp-api.mindnetwork.xyz",
});

//
request.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["Version"] = "0.1.0";

  return config;
});
request.interceptors.response.use(
  (response) => {
    const data = response.data || {};
    if (data.code !== 0) {
      throw new Error(data?.message || "Unknown Error");
    }
    return data.data;
  },
  (error) => {
    if (error?.message === "Network Error") {
      throw new Error("Please check your network connectivity !");
    } else {
      throw new Error(error);
    }
  }
);
export default request;
