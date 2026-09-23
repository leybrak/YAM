import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function getRadianAngle(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function rotatedBoxSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/** Rotates the source image onto a canvas, then crops to `pixelCrop`,
 * returning a JPEG blob ready to upload. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);
  const { width: boxWidth, height: boxHeight } = rotatedBoxSize(image.width, image.height, rotation);

  const rotateCanvas = document.createElement("canvas");
  rotateCanvas.width = boxWidth;
  rotateCanvas.height = boxHeight;
  const rotateCtx = rotateCanvas.getContext("2d");
  if (!rotateCtx) throw new Error("No se pudo procesar la imagen");

  rotateCtx.translate(boxWidth / 2, boxHeight / 2);
  rotateCtx.rotate(rotRad);
  rotateCtx.translate(-image.width / 2, -image.height / 2);
  rotateCtx.drawImage(image, 0, 0);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = pixelCrop.width;
  outputCanvas.height = pixelCrop.height;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("No se pudo procesar la imagen");

  outputCtx.drawImage(
    rotateCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/jpeg",
      0.92
    );
  });
}
