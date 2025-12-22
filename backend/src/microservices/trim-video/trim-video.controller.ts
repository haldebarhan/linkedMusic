import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { handleError } from "../../utils/helpers/handle-error";
import { TrimVideoDTO } from "./trim-video.dto";
import fs from "fs/promises";
import {
  cleanup,
  createZip,
  trimVideo,
} from "../../utils/functions/trim-video";
import path from "path";
import os from "os";

@injectable()
export class TrimVideoController {
  async trimVideo(req: Request, res: Response) {
    let inputPath: string | undefined = undefined;
    try {
      const dto: TrimVideoDTO = Object.assign(new TrimVideoDTO(), req.body);
      const { startTime, endTime, maxSizeMB } = dto;
      const file = req.file as Express.Multer.File;
      if (!file) {
        res.status(400).json({ error: "Aucun fichier vidéo fourni" });
      }
      inputPath = file.path;
      if (!inputPath && file.buffer) {
        const tempDir = path.join(os.tmpdir(), "video-trim-temp");
        await fs.mkdir(tempDir, { recursive: true });
        inputPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        await fs.writeFile(inputPath, file.buffer);
        console.log(
          `⚠️ Buffer écrit temporairement sur disque à : ${inputPath}`
        );
      }
      if (!inputPath) {
        res.status(400).json({
          error: "Impossible de traiter le fichier (pas de path ou buffer)",
        });
      }

      const duration = endTime - startTime;
      if (duration > 60) {
        res.status(400).json({ error: "Durée maximum: 60 secondes" });
      }
      const outputPath = await trimVideo(inputPath, startTime, endTime);
      const stats = await fs.stat(outputPath);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB <= maxSizeMB) {
        res.type("video/mp4");
        res.download(outputPath, "video.mp4", async (err) => {
          if (err) console.error("Erreur envoi:", err);
          await cleanup([inputPath!, outputPath]);
        });
        return;
      }
      const midPoint = startTime + duration / 2;
      const part1 = await trimVideo(inputPath, startTime, midPoint);
      const part2 = await trimVideo(inputPath, midPoint, endTime);

      const part1Stats = await fs.stat(part1);
      const part2Stats = await fs.stat(part2);

      console.log("✅ Split terminé:", {
        part1: `${(part1Stats.size / 1024 / 1024).toFixed(2)} MB`,
        part2: `${(part2Stats.size / 1024 / 1024).toFixed(2)} MB`,
      });

      const zipPath = path.join(os.tmpdir(), `segments-${Date.now()}.zip`);
      await createZip([part1, part2], zipPath);

      res.type("application/zip");
      res.download(zipPath, "segments.zip", async (err) => {
        if (err) console.error("Erreur envoi:", err);
        await cleanup([inputPath!, outputPath, part1, part2, zipPath]);
      });
    } catch (error) {
      console.error("Erreur globale trim:", error);
      handleError(res, error);
    }
  }
}
