import { injectable } from "tsyringe";
import { ReferenceDataService } from "./reference-base.service";
import { Request, Response } from "express";
import { handleError } from "../../utils/helpers/handle-error";
import { formatResponse } from "../../utils/helpers/response-formatter";
import {
  CreateInstrumentDto,
  CreateLanguageDto,
  CreateMusicStyleDto,
  CreateSoftwareDto,
  UpdateInstrumentDto,
  UpdateLanguageDto,
  UpdateMusicStyleDto,
  UpdateSoftwareDto,
} from "./reference-data.dto";

@injectable()
export class ReferenceDataController {
  constructor(private readonly service: ReferenceDataService) {}

  async getAllMusicStyles(req: Request, res: Response) {
    try {
      const styles = await this.service.getAllMusicStyles();
      const response = formatResponse(200, styles);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMusicStylesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const styles = await this.service.getMusicStylesByCategory(category);
      const response = formatResponse(200, styles);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getMusicStyleCategories(req: Request, res: Response) {
    try {
      const categories = await this.service.getMusicStyleCategories();
      const response = formatResponse(200, categories);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async searchMusicStyles(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const styles = await this.service.searchMusicStyles(q as string);
      const response = formatResponse(200, styles);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createMusicStyle(req: Request, res: Response) {
    try {
      const dto: CreateMusicStyleDto = Object.assign(
        new CreateMusicStyleDto(),
        req.body
      );
      const style = await this.service.createMusicStyle(dto);
      const response = formatResponse(200, style);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateMusicStyle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateMusicStyleDto = Object.assign(
        new UpdateMusicStyleDto(),
        req.body
      );
      const style = await this.service.updateMusicStyle(id, dto);
      const response = formatResponse(200, style);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeMusicStyle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteMusicStyle(id);
      const result = { message: "Style supprimé" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== INSTRUMENTS  ==========

  async getAllInstruments(req: Request, res: Response) {
    try {
      const instruments = await this.service.getAllInstruments();
      const response = formatResponse(200, instruments);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getInstrumentsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const instruments = await this.service.getInstrumentsByCategory(category);
      const response = formatResponse(200, instruments);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async getInstrumentCategories(req: Request, res: Response) {
    try {
      const categories = await this.service.getInstrumentCategories();
      const response = formatResponse(200, categories);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async searchInstruments(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const instruments = await this.service.searchInstruments(q as string);
      const response = formatResponse(200, instruments);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createInstrument(req: Request, res: Response) {
    try {
      const dto: CreateInstrumentDto = Object.assign(
        new CreateInstrumentDto(),
        req.body
      );
      const instrument = await this.service.createInstrument(dto);
      const response = formatResponse(200, instrument);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateInstrument(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateInstrumentDto = Object.assign(
        new UpdateInstrumentDto(),
        req.body
      );
      const instrument = await this.service.updateInstrument(id, dto);
      const response = formatResponse(200, instrument);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeInstrument(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteInstrument(id);
      const result = { message: "Instrument supprimé" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== LANGUAGES ==========

  async getAllLanguages(req: Request, res: Response) {
    try {
      const languages = await this.service.getAllLanguages();
      const response = formatResponse(200, languages);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async searchLanguages(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const language = await this.service.searchLanguages(q as string);
      const response = formatResponse(200, language);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createLanguage(req: Request, res: Response) {
    try {
      const dto: CreateLanguageDto = Object.assign(
        new CreateLanguageDto(),
        req.body
      );
      const language = await this.service.createLanguage(dto);
      const response = formatResponse(200, language);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateLanguage(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateLanguageDto = Object.assign(
        new UpdateLanguageDto(),
        req.body
      );
      const language = await this.service.updateLanguage(id, dto);
      const response = formatResponse(200, language);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeLanguage(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteLanguage(id);
      const result = { message: "Langage supprimé" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ========== SOFTWARE ==========

  async getAllSoftware(req: Request, res: Response) {
    try {
      const softwares = await this.service.getAllSoftware();
      const response = formatResponse(200, softwares);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async searchSoftware(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const software = await this.service.searchSoftware(q as string);
      const response = formatResponse(200, software);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async createSoftware(req: Request, res: Response) {
    try {
      const dto: CreateSoftwareDto = Object.assign(
        new CreateSoftwareDto(),
        req.body
      );
      const software = await this.service.createSoftware(dto);
      const response = formatResponse(200, software);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateSoftware(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateSoftwareDto = Object.assign(
        new UpdateSoftwareDto(),
        req.body
      );
      const software = await this.service.updateSoftware(id, dto);
      const response = formatResponse(200, software);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeSoftware(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.deleteSoftware(id);
      const result = { message: "Software supprimé" };
      const response = formatResponse(200, result);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
