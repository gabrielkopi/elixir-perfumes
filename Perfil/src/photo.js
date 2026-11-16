const MODEL_PATH = `${import.meta.env.BASE_URL}models/selfie_segmenter.tflite`;
const MAX_PHOTO_SIZE = 1440;
const MAX_INFERENCE_SIZE = 640;

let segmenterPromise;

export function loadPhoto(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível abrir esta imagem. Tente usar JPG, PNG ou WebP.'));
    image.src = source;
  });
}

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function photoCanvas(image, maxSize) {
  const ratio = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = makeCanvas(
    Math.max(1, Math.round(image.naturalWidth * ratio)),
    Math.max(1, Math.round(image.naturalHeight * ratio)),
  );
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function preparePhoto(file) {
  if (!file?.size) throw new Error('Escolha uma imagem para o seu perfil.');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadPhoto(url);
    const canvas = photoCanvas(image, MAX_PHOTO_SIZE);
    const { width, height } = canvas;
    const { data } = canvas.getContext('2d').getImageData(0, 0, width, height);
    let transparent = false;

    for (let index = 3; index < data.length; index += 4) {
      if (data[index] < 255) {
        transparent = true;
        break;
      }
    }

    const source = transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
    return { source, transparent, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function wasmFiles(simd) {
  if (simd) {
    return {
      wasmLoaderPath: new URL('../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js', import.meta.url).href,
      wasmBinaryPath: new URL('../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm', import.meta.url).href,
    };
  }
  return {
    wasmLoaderPath: new URL('../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.js', import.meta.url).href,
    wasmBinaryPath: new URL('../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm', import.meta.url).href,
  };
}

async function createSegmenter() {
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
  const simd = await FilesetResolver.isSimdSupported();
  return ImageSegmenter.createFromOptions(wasmFiles(simd), {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
    runningMode: 'IMAGE',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
}

function getSegmenter() {
  segmenterPromise ??= createSegmenter().catch((error) => {
    segmenterPromise = undefined;
    throw new Error('O recorte automático ficou indisponível. Tente novamente ou use o ajuste manual.', { cause: error });
  });
  return segmenterPromise;
}

function confidenceMatte(mask) {
  const { width, height } = mask;
  const matte = makeCanvas(width, height);
  const context = matte.getContext('2d');
  const pixels = context.createImageData(width, height);
  const confidence = mask.getAsFloat32Array();
  let subjectPixels = 0;

  for (let index = 0; index < confidence.length; index += 1) {
    const value = confidence[index];
    const blend = Math.max(0, Math.min(1, (value - 0.18) / 0.60));
    pixels.data[index * 4 + 3] = Math.round(255 * blend * blend * (3 - 2 * blend));
    if (value > 0.62) subjectPixels += 1;
  }

  if (subjectPixels < confidence.length * 0.005) {
    throw new Error('Não encontrei um retrato nesta imagem. Você pode fazer o recorte com o pincel.');
  }

  context.putImageData(pixels, 0, 0);
  return matte;
}

export async function removePhotoBackground(source) {
  const [image, segmenter] = await Promise.all([loadPhoto(source), getSegmenter()]);
  const inference = photoCanvas(image, MAX_INFERENCE_SIZE);
  let matte;
  segmenter.segment(inference, (result) => {
    const person = result.confidenceMasks[1] ?? result.confidenceMasks[0];
    if (person) matte = confidenceMatte(person);
  });

  if (!matte) throw new Error('O recorte automático não retornou uma máscara. Experimente o ajuste manual.');

  const output = photoCanvas(image, MAX_PHOTO_SIZE);
  const context = output.getContext('2d');
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(matte, 0, 0, output.width, output.height);
  return output.toDataURL('image/png');
}
