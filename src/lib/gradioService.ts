/**
 * Gradio API service for connecting to the Bird Colony Counter HuggingFace Space.
 *
 * Endpoint: https://dineshchhantyal-bird-colony-counter.hf.space/
 * API: /api/predict — accepts an image, returns (visualization, bird_count, nest_count, model_info)
 */

import { Client } from "@gradio/client";

const HF_SPACE = "dineshchhantyal/bird-colony-counter";

let clientInstance: Awaited<ReturnType<typeof Client.connect>> | null = null;

async function getClient() {
  if (!clientInstance) {
    clientInstance = await Client.connect(HF_SPACE);
  }
  return clientInstance;
}

export type PredictionResult = {
  visualization: string; // URL to the visualization image
  birdCount: string;     // e.g. "431.2" or "431.2 +/- 28.1 (95% CI)"
  nestCount: string;     // e.g. "305.8" or "305.8 +/- 15.3 (95% CI)"
  modelInfo: string;     // e.g. "Model: density (vgg16)\nDevice: cpu\n..."
};

/**
 * Send an image to the Bird Colony Counter for prediction.
 * @param imageFile - File or Blob of the aerial image
 * @returns Prediction results with counts and visualization
 */
export async function predictImage(imageFile: File | Blob): Promise<PredictionResult> {
  const client = await getClient();

  const result = await client.predict("/predict", {
    input_image: imageFile,
  });

  const data = result.data as [
    { url: string } | null,  // visualization image
    string,                   // bird count
    string,                   // nest count
    string,                   // model info
  ];

  return {
    visualization: data[0]?.url ?? "",
    birdCount: data[1] ?? "N/A",
    nestCount: data[2] ?? "N/A",
    modelInfo: data[3] ?? "",
  };
}

/**
 * Check if the HuggingFace Space is available.
 */
export async function checkSpaceStatus(): Promise<boolean> {
  try {
    const client = await getClient();
    return !!client;
  } catch {
    return false;
  }
}
