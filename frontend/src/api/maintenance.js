import { axiosInstance as api } from "./axios.js";

export const getLogs = (params) =>
    api.get("/maintenance/", { params });

export const getLog = (id) =>
    api.get(`/maintenance/${id}`);

export const getStats = () =>
    api.get("/maintenance/stats");

export const createLog = (data) =>
    api.post("/maintenance/", data);

export const updateLog = (id, data) =>
    api.put(`/maintenance/${id}`, data);

export const resolveLog = (id) =>
    api.patch(`/maintenance/${id}/resolve`);

export const deleteLog = (id) =>
    api.delete(`/maintenance/${id}`);
