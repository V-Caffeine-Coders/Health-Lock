import Record from "../models/record.model.js";

export const getRecordById = async (id) => {
  return await Record.findById(id).populate("patient");
};
