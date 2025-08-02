import {
  CreateFieldDTO,
  CreateFieldOptionDTO,
} from "@/microservices/categories/category.dto";
import { FieldOptionRepository } from "@/microservices/field-options/field-option.repository";
import { FieldRepository } from "@/microservices/fields/field.repository";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "../services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const createServiceField = async (
  fields: CreateFieldDTO[],
  serviceId: number,
  fieldRepository: FieldRepository,
  fieldOptionRepository: FieldOptionRepository
) => {
  const fieldNames = fields.map((field) => field.name);
  const existingFields = await fieldRepository.findManyByParams({
    name: { in: fieldNames },
  });

  const missingFields = fields.filter(
    (field) => !existingFields.find((f) => f.name === field.name)
  );
  const createFields = await Promise.all(
    missingFields.map(async (field) => {
      const { options, ...rest } = field;
      const createField = await fieldRepository.create(rest);
      if (options)
        await createFieldOptions(
          options,
          createField.id,
          fieldOptionRepository
        );
      return createField;
    })
  );
  const allFields = [...existingFields, ...createFields];
  const data = allFields.map((field) => ({
    serviceTypeId: serviceId,
    fieldId: field.id,
  }));
  await prisma.serviceTypeField.createMany({ data });
};
export const createFieldOptions = async (
  fieldOption: CreateFieldOptionDTO[],
  fieldId: number,
  fieldOptionRepository: FieldOptionRepository
) => {
  await Promise.all(
    fieldOption.map(
      async (option) =>
        await fieldOptionRepository.create({ ...option, fieldId })
    )
  );
};
