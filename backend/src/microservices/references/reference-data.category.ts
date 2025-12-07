import { injectable } from "tsyringe";
import { MusicStyleRepository } from "../musics/music.repository";
import { InstrumentRepository } from "../instruments/instrument.repository";
import { LanguageRepository } from "../languages/language.repository";
import { SoftwareRepository } from "../softwares/software.repository";
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
import { AppError } from "../../utils/classes/app-error";
import { ErrorCode } from "../../utils/enums/error-code.enum";

@injectable()
export class ReferenceDataService {
  constructor(
    private readonly musicStyleRepository: MusicStyleRepository,
    private readonly instrumentRepository: InstrumentRepository,
    private readonly languageRepository: LanguageRepository,
    private readonly softwareRepository: SoftwareRepository
  ) {}

  // ========== MUSIC STYLES ==========

  async getAllMusicStyles() {
    return this.musicStyleRepository.findAllActive();
  }

  async getMusicStylesByCategory(category: string) {
    return this.musicStyleRepository.findByCategory(category);
  }

  async getMusicStyleCategories() {
    return this.musicStyleRepository.getCategories();
  }

  async searchMusicStyles(query: string) {
    return this.musicStyleRepository.search(query);
  }

  async createMusicStyle(dto: CreateMusicStyleDto) {
    return this.musicStyleRepository.create(dto);
  }

  async updateMusicStyle(id: number, dto: UpdateMusicStyleDto) {
    const style = await this.musicStyleRepository.findById(id);
    if (!style) {
      throw new AppError(ErrorCode.NOT_FOUND, "Style musical non trouvé", 404);
    }
    return this.musicStyleRepository.update(id, dto);
  }

  async deleteMusicStyle(id: number) {
    return this.musicStyleRepository.delete(id);
  }

  // ========== INSTRUMENTS ==========

  async getAllInstruments() {
    return this.instrumentRepository.findAllActive();
  }

  async getInstrumentsByCategory(category: string) {
    return this.instrumentRepository.findByCategory(category);
  }

  async getInstrumentCategories() {
    return this.instrumentRepository.getCategories();
  }

  async searchInstruments(query: string) {
    return this.instrumentRepository.search(query);
  }

  async createInstrument(dto: CreateInstrumentDto) {
    return this.instrumentRepository.create(dto);
  }

  async updateInstrument(id: number, dto: UpdateInstrumentDto) {
    const instrument = await this.instrumentRepository.findById(id);
    if (!instrument) {
      throw new AppError(ErrorCode.NOT_FOUND, "Instrument non trouvé", 404);
    }
    return this.instrumentRepository.update(id, dto);
  }

  async deleteInstrument(id: number) {
    return this.instrumentRepository.delete(id);
  }

  // ========== LANGUAGES ==========

  async getAllLanguages() {
    return this.languageRepository.findAllActive();
  }

  async searchLanguages(query: string) {
    return this.languageRepository.search(query);
  }

  async createLanguage(dto: CreateLanguageDto) {
    return this.languageRepository.create(dto);
  }

  async updateLanguage(id: number, dto: UpdateLanguageDto) {
    const language = await this.languageRepository.findById(id);
    if (!language) {
      throw new AppError(ErrorCode.NOT_FOUND, "Langue non trouvée", 404);
    }
    return this.languageRepository.update(id, dto);
  }

  async deleteLanguage(id: number) {
    return this.languageRepository.delete(id);
  }

  // ========== SOFTWARE ==========

  async getAllSoftware() {
    return this.softwareRepository.findAllActive();
  }

  async getSoftwareByType(type: string) {
    return this.softwareRepository.findByType(type);
  }

  async getSoftwareTypes() {
    return this.softwareRepository.getTypes();
  }

  async searchSoftware(query: string) {
    return this.softwareRepository.search(query);
  }

  async createSoftware(dto: CreateSoftwareDto) {
    return this.softwareRepository.create(dto);
  }

  async updateSoftware(id: number, dto: UpdateSoftwareDto) {
    const software = await this.softwareRepository.findById(id);
    if (!software) {
      throw new AppError(ErrorCode.NOT_FOUND, "Logiciel non trouvé", 404);
    }
    return this.softwareRepository.update(id, dto);
  }

  async deleteSoftware(id: number) {
    return this.softwareRepository.delete(id);
  }
}
