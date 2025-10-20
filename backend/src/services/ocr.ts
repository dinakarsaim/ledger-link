// // // // src/services/ocr.ts
// // // import path from "path";
// // // import fs from "fs";
// // // import sharp from "sharp";
// // // import { createWorker, PSM } from "tesseract.js";

// // // /**
// // //  * Lightweight OCR service using tesseract.js + sharp preprocessing.
// // //  * Uses a single worker instance for reuse during server lifetime.
// // //  */

// // // const worker = createWorker({
// // //   // you can set logger: m => console.log(m) to see progress
// // //   // logger: (m) => console.log("[tesseract]", m),
// // // });

// // // let workerInitialized = false;

// // // async function initWorker() {
// // //   if (workerInitialized) return;
// // //   await worker.load();
// // //   await worker.loadLanguage("eng");
// // //   await worker.initialize("eng");
// // //   // Optional: set page segmentation mode (PSM) to AUTO or SINGLE_BLOCK etc.
// // //   await worker.setParameters({
// // //     tessedit_pageseg_mode: PSM.AUTO.toString(),
// // //     // you can tune additional params here
// // //   } as any);
// // //   workerInitialized = true;
// // // }

// // // /**
// // //  * Preprocess image with sharp for OCR:
// // //  * - convert to greyscale
// // //  * - resize large images down while keeping enough DPI
// // //  * - increase contrast a touch
// // //  */
// // // async function preprocessForOCR(inputPath: string) {
// // //   const tmp = `${inputPath}.ocr.jpg`;
// // //   await sharp(inputPath)
// // //     .rotate() // respect EXIF orientation
// // //     .resize({ width: 2000, withoutEnlargement: true }) // keep it manageable
// // //     .greyscale()
// // //     .normalize() // improve contrast
// // //     .jpeg({ quality: 80 })
// // //     .toFile(tmp);
// // //   return tmp;
// // // }

// // // export async function recognizeImage(imagePath: string) {
// // //   await initWorker();

// // //   // Preprocess into a temp file (so Tesseract gets a cleaned image)
// // //   const preprocessed = await preprocessForOCR(imagePath);

// // //   try {
// // //     const { data } = await worker.recognize(preprocessed);
// // //     // data.text contains the full OCR text
// // //     // data.words / data.lines have more structured info if needed
// // //     return data;
// // //   } finally {
// // //     // cleanup temp file
// // //     try { fs.unlinkSync(preprocessed); } catch (e) { /* ignore */ }
// // //   }
// // // }

// // // /**
// // //  * Optional: graceful shutdown for worker when process exits
// // //  */
// // // export async function shutdownOCR() {
// // //   if (!workerInitialized) return;
// // //   await worker.terminate();
// // //   workerInitialized = false;
// // // }

// // // backend/src/services/ocr.ts
// // import path from "path";
// // import fs from "fs";
// // import sharp from "sharp";
// // import { createWorker, PSM, RecognizeResult } from "tesseract.js";

// // /**
// //  * OCR service using tesseract.js + sharp preprocessing.
// //  *
// //  * Notes:
// //  * - tesseract.js currently doesn't have first-class TypeScript types for every option,
// //  *   so we cast a few values to `any` to satisfy the compiler while keeping runtime behavior.
// //  * - This file creates a single long-lived worker instance for reuse.
// //  */

// // // Create a single worker for the lifetime of the process.
// // // We cast the options to `any` because tesseract's logger type is not strictly typed here.
// // const worker = createWorker({
// //   // Uncomment logger if you want runtime debug logs:
// //   // logger: (m: any) => console.log("[tesseract]", m),
// // } as any);

// // let workerInitialized = false;

// // /** Initialize the tesseract worker once. Safe to call multiple times. */
// // async function initWorker() {
// //   if (workerInitialized) return;
// //   await worker.load();
// //   await worker.loadLanguage("eng");
// //   await worker.initialize("eng");
// //   // setParameters typing is not strict — cast to any
// //   await (worker as any).setParameters({
// //     // tessedit_pageseg_mode expects a number/string depending on tesseract version; using PSM enum for clarity
// //     tessedit_pageseg_mode: PSM.AUTO.toString(),
// //     // you can add more tuning params here if needed
// //   } as any);
// //   workerInitialized = true;
// // }

// // /** Preprocess image for OCR using sharp to improve results. Returns path to a temp preprocessed jpeg. */
// // async function preprocessForOCR(inputPath: string) {
// //   const tmp = `${inputPath}.ocr.jpg`;

// //   // Sharp transforms:
// //   // - rotate according to EXIF
// //   // - resize to a reasonable width (avoid huge images)
// //   // - convert to grayscale, normalize contrast, and write jpeg
// //   await sharp(inputPath)
// //     .rotate()
// //     .resize({ width: 2000, withoutEnlargement: true })
// //     .greyscale()
// //     .normalize()
// //     .jpeg({ quality: 80 })
// //     .toFile(tmp);

// //   return tmp;
// // }

// // /**
// //  * Recognize image and return the tesseract result object.
// //  * Returns an object containing `text` and the full `data` if you need structured output.
// //  */
// // export async function recognizeImage(imagePath: string): Promise<{ text: string; data: any }> {
// //   await initWorker();

// //   const preprocessed = await preprocessForOCR(imagePath);

// //   try {
// //     // `worker.recognize` returns a Promise with { data } where data includes `.text` and structured layout.
// //     const { data } = await (worker as any).recognize(preprocessed) as { data: RecognizeResult & any };
// //     const text = data?.text ?? "";
// //     return { text, data };
// //   } finally {
// //     // cleanup temp file; ignore errors
// //     try { fs.unlinkSync(preprocessed); } catch (e) { /* ignore */ }
// //   }
// // }

// // /** Gracefully terminate the worker (call on process exit in dev if you want) */
// // export async function shutdownOCR() {
// //   if (!workerInitialized) return;
// //   await (worker as any).terminate();
// //   workerInitialized = false;
// // }

// // backend/src/services/ocr.ts

// import path from "path";
// import fs from "fs";
// import sharp from "sharp";
// import { createWorker, PSM, RecognizeResult } from "tesseract.js";

// /**
//  * OCR service using tesseract.js + sharp preprocessing.
//  * This version accounts for createWorker() possibly returning a Promise.
//  */

// // We'll store the actual worker instance here (or null if not created yet).
// // Use `any` because tesseract types are not fully strict for all methods.
// let worker: any = null;
// let workerInitialized = false;

// /** Initialize the tesseract worker once. Safe to call multiple times. */
// async function initWorker() {
//   if (workerInitialized) return;

//   // createWorker() may return a Worker or a Promise<Worker> depending on installed package.
//   // So await it to be safe.
//   worker = await createWorker() as any;

//   // Now call the usual lifecycle methods
//   await worker.load();
//   await worker.loadLanguage("eng");
//   await worker.initialize("eng");

//   // setParameters typing is not strict — cast to any
//   await (worker as any).setParameters({
//     // use PSM AUTO for general receipts; you can try other modes later
//     tessedit_pageseg_mode: PSM.AUTO.toString(),
//   } as any);

//   workerInitialized = true;
// }

// /** Preprocess image for OCR using sharp to improve results. Returns path to a temp preprocessed jpeg. */
// async function preprocessForOCR(inputPath: string) {
//   const tmp = `${inputPath}.ocr.jpg`;

//   await sharp(inputPath)
//     .rotate() // respect EXIF orientation
//     .resize({ width: 2000, withoutEnlargement: true })
//     .greyscale()
//     .normalize()
//     .jpeg({ quality: 80 })
//     .toFile(tmp);

//   return tmp;
// }

// /**
//  * Recognize image and return the tesseract result object.
//  * Returns { text, data } where data is tesseract's structured output.
//  */
// export async function recognizeImage(imagePath: string): Promise<{ text: string; data: any }> {
//   // ensure worker is initialized
//   await initWorker();

//   // preprocess and run recognition
//   const preprocessed = await preprocessForOCR(imagePath);

//   try {
//     const { data } = await (worker as any).recognize(preprocessed) as { data: RecognizeResult & any };
//     const text = data?.text ?? "";
//     return { text, data };
//   } finally {
//     // cleanup temp file
//     try { fs.unlinkSync(preprocessed); } catch (e) { /* ignore */ }
//   }
// }

// /** Gracefully terminate the worker */
// export async function shutdownOCR() {
//   if (!workerInitialized || !worker) return;
//   await (worker as any).terminate();
//   workerInitialized = false;
//   worker = null;
// }

// backend/src/services/ocr.ts
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { createWorker, PSM, RecognizeResult } from "tesseract.js";

/**
 * Robust OCR service compatible with multiple tesseract.js versions.
 * - Awaits createWorker() to obtain the actual worker.
 * - Calls lifecycle methods only if they exist on the worker instance.
 * - Preprocesses images with sharp to improve OCR quality.
 */

let worker: any = null;
let workerInitialized = false;

async function initWorker() {
  if (workerInitialized) return;

  // createWorker() may return a Worker or a Promise<Worker> depending on the package
  worker = await createWorker() as any;
  console.log("[ocr] worker created");

  // Defensive: call the lifecycle functions only if they exist.
  // Newer tesseract.js versions may not expose load/loadLanguage/initialize,
  // or they may already be done for you.
  if (typeof worker.load === "function") {
    try {
      await worker.load();
      console.log("[ocr] worker.load() called");
    } catch (e) {
      console.warn("[ocr] worker.load() failed or deprecated:", e);
    }
  } else {
    console.log("[ocr] worker.load not present (skipping)");
  }

  if (typeof worker.loadLanguage === "function") {
    try {
      await worker.loadLanguage("eng");
      console.log("[ocr] worker.loadLanguage('eng') called");
    } catch (e) {
      console.warn("[ocr] worker.loadLanguage failed:", e);
    }
  } else {
    console.log("[ocr] worker.loadLanguage not present (skipping)");
  }

  if (typeof worker.initialize === "function") {
    try {
      await worker.initialize("eng");
      console.log("[ocr] worker.initialize('eng') called");
    } catch (e) {
      console.warn("[ocr] worker.initialize failed:", e);
    }
  } else {
    console.log("[ocr] worker.initialize not present (skipping)");
  }

  // Try to set parameters if setParameters exists
  if (typeof worker.setParameters === "function") {
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO.toString(),
        // other tuning params could go here
      } as any);
      console.log("[ocr] worker.setParameters called");
    } catch (e) {
      console.warn("[ocr] worker.setParameters failed:", e);
    }
  } else {
    console.log("[ocr] worker.setParameters not present (skipping)");
  }

  workerInitialized = true;
  console.log("[ocr] worker initialization complete");
}

/** Preprocess image for OCR using sharp to improve results. Returns path to a temp preprocessed jpeg. */
async function preprocessForOCR(inputPath: string) {
  const tmp = `${inputPath}.ocr.jpg`;
  await sharp(inputPath)
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .greyscale()
    .normalize()
    .jpeg({ quality: 80 })
    .toFile(tmp);
  return tmp;
}

/**
 * Recognize image and return the tesseract result object.
 * Returns { text, data } where data is tesseract's structured output.
 */
export async function recognizeImage(imagePath: string): Promise<{ text: string; data: any }> {
  // ensure worker is initialized (does nothing if already initialized)
  await initWorker();

  const preprocessed = await preprocessForOCR(imagePath);

  try {
    // use recognize; in most versions this exists. Wrap in try/catch to surface problems.
    if (typeof worker.recognize !== "function") {
      throw new Error("worker.recognize is not available on this tesseract worker");
    }

    const { data } = await worker.recognize(preprocessed) as { data: RecognizeResult & any };
    const text = data?.text ?? "";
    return { text, data };
  } finally {
    try { fs.unlinkSync(preprocessed); } catch (e) { /* ignore */ }
  }
}

/** Gracefully terminate the worker */
export async function shutdownOCR() {
  if (!workerInitialized || !worker) return;
  if (typeof worker.terminate === "function") {
    try {
      await worker.terminate();
      console.log("[ocr] worker terminated");
    } catch (e) {
      console.warn("[ocr] worker.terminate failed:", e);
    }
  }
  workerInitialized = false;
  worker = null;
}