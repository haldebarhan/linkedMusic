import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import archiver from "archiver";

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const trimVideo = async (
  filePath: string,
  startTime: number,
  endTime: number
) => {
  fs.mkdir("temp/outputs", { recursive: true }, (err) => {
    if (err) console.error(err);
  });
  const outputPath = path.join("temp/outputs", `extrait-${Date.now()}.mp4`);

  return new Promise<string>((resolve, reject) => {
    const duration = endTime - startTime;
    ffmpeg(filePath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        "-c copy",
        "-avoid_negative_ts 1",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("start", (cmd: any) => {})
      .on("progress", (progress: any) => {
        if (progress.percent) {
          console.log(`  Progression: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on("end", () => {
        resolve(outputPath);
      })
      .on("error", (err: any) => {
        console.error("  ❌ Erreur FFmpeg:", err);
        reject(err);
      })
      .run();
  });
};

export const createZip = (filesPaths: string[], zipPath: string) => {
  return new Promise<void>((resolve, reject) => {
    const output = require("fs").createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 0 } });

    output.on("close", () => {
      console.log(`  ✅ ZIP créé: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on("error", (err) => {
      console.error("  ❌ Erreur ZIP:", err);
      reject(err);
    });

    archive.pipe(output);

    filesPaths.forEach((filePath, index) => {
      const fileName = `video_part_${index + 1}.mp4`;
      archive.file(filePath, { name: fileName });
    });
    archive.finalize();
  });
};

export const cleanup = async (filesPaths: string[]) => {
  for (const filePath of filesPaths) {
    try {
      fs.unlink(filePath, (err) => {
        if (err)
          console.error(`  ❌ Erreur suppression fichier ${filePath}:`, err);
        else console.log(`  🗑️ Fichier supprimé: ${filePath}`);
      });
    } catch (err) {
      // Ignorer si fichier n'existe pas
    }
  }
};
