import * as ort from 'onnxruntime-web';

export interface YoloDetection {
    bbox: [number, number, number, number]; // [x, y, w, h]
    class: string;
    score: number;
}

const COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 
    'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 
    'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

export class YoloDetector {
    private session: ort.InferenceSession | null = null;

    async loadModel(modelUrl: string) {
        try {
            // Set up onnxruntime-web to use WASM
            ort.env.wasm.numThreads = 1;
            ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/';
            this.session = await ort.InferenceSession.create(modelUrl, { 
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });
            console.log("🚀 YOLOv8 Model loaded successfully. Input names:", this.session.inputNames, "Output names:", this.session.outputNames);
        } catch (e) {
            console.error("❌ Failed to load YOLOv8 model:", e);
            throw e;
        }
    }

    async detect(video: HTMLVideoElement): Promise<YoloDetection[]> {
        if (!this.session) return [];
        if (video.readyState < 2 || video.videoWidth === 0) return [];

        const width = 640;
        const height = 640; 
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];

        // Fill background with black to preserve aspect ratio if needed, but here we just stretch
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;

        const floatData = new Float32Array(width * height * 3);
        const area = width * height;
        for (let i = 0; i < area; i++) {
            floatData[i] = data[i * 4] / 255.0;           
            floatData[i + area] = data[i * 4 + 1] / 255.0; 
            floatData[i + area * 2] = data[i * 4 + 2] / 255.0; 
        }

        try {
            const inputName = this.session.inputNames[0];
            const inputTensor = new ort.Tensor('float32', floatData, [1, 3, 640, 640]);
            
            const feeds: Record<string, ort.Tensor> = {};
            feeds[inputName] = inputTensor;
            
            const results = await this.session.run(feeds);
            
            const outputName = this.session.outputNames[0];
            const output = results[outputName].data as Float32Array;
            const dims = results[outputName].dims;

            return this.postProcess(output, dims);
        } catch (e) {
            console.error("Inference failed:", e);
            return [];
        }
    }

    private postProcess(output: Float32Array, dims: readonly number[]): YoloDetection[] {
        const detections: YoloDetection[] = [];
        const numClasses = 80;
        
        // Handle different output shapes: [1, 84, 8400] or [1, 8400, 84]
        let numBoxes: number;
        let shapeVariant: 'rows_is_84' | 'cols_is_84';

        if (dims[1] === 84 || dims[1] === (numClasses + 4)) {
            numBoxes = dims[2];
            shapeVariant = 'rows_is_84';
        } else if (dims[2] === 84 || dims[2] === (numClasses + 4)) {
            numBoxes = dims[1];
            shapeVariant = 'cols_is_84';
        } else {
            console.warn("Unexpected YOLO output shape:", dims);
            return [];
        }
        
        let globalMaxScore = 0;

        for (let i = 0; i < numBoxes; i++) {
            let maxScore = 0;
            let classId = -1;

            for (let c = 0; c < numClasses; c++) {
                const score = shapeVariant === 'rows_is_84' 
                    ? output[(4 + c) * numBoxes + i]
                    : output[i * (numClasses + 4) + (4 + c)];
                    
                if (score > maxScore) {
                    maxScore = score;
                    classId = c;
                }
            }

            if (maxScore > globalMaxScore) globalMaxScore = maxScore;

            if (maxScore > 0.15) { // Very low threshold for debugging
                const xc = shapeVariant === 'rows_is_84' ? output[0 * numBoxes + i] : output[i * (numClasses + 4) + 0];
                const yc = shapeVariant === 'rows_is_84' ? output[1 * numBoxes + i] : output[i * (numClasses + 4) + 1];
                const w  = shapeVariant === 'rows_is_84' ? output[2 * numBoxes + i] : output[i * (numClasses + 4) + 2];
                const h  = shapeVariant === 'rows_is_84' ? output[3 * numBoxes + i] : output[i * (numClasses + 4) + 3];

                const x = xc - w / 2;
                const y = yc - h / 2;

                detections.push({
                    bbox: [x, y, w, h],
                    class: COCO_CLASSES[classId] || `class_${classId}`,
                    score: maxScore
                });
            }
        }

        const finalResults = this.nms(detections);
        if (finalResults.length > 0) {
            console.log("🟢 YOLO Detected:", finalResults.map(r => `${r.class} (${Math.round(r.score*100)}%)`).join(", "));
        } else {
            // Log every ~5 seconds (approx with 1sec interval)
            if (Math.random() > 0.8) console.log("⚪ YOLO: Scanning... (Best candidate: " + (globalMaxScore * 100).toFixed(1) + "%)");
        }
        return finalResults;
    }

    private nms(detections: YoloDetection[]): YoloDetection[] {
        detections.sort((a, b) => b.score - a.score);
        const result: YoloDetection[] = [];
        const used = new Array(detections.length).fill(false);

        for (let i = 0; i < detections.length; i++) {
            if (used[i]) continue;
            result.push(detections[i]);
            for (let j = i + 1; j < detections.length; j++) {
                if (used[j]) continue;
                if (this.iou(detections[i].bbox, detections[j].bbox) > 0.45) {
                    used[j] = true;
                }
            }
        }
        return result;
    }

    private iou(box1: [number, number, number, number], box2: [number, number, number, number]): number {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const x_left = Math.max(x1, x2);
        const y_top = Math.max(y1, y2);
        const x_right = Math.min(x1 + w1, x2 + w2);
        const y_bottom = Math.min(y1 + h1, y2 + h2);

        if (x_right < x_left || y_bottom < y_top) return 0;

        const intersection_area = (x_right - x_left) * (y_bottom - y_top);
        const area1 = w1 * h1;
        const area2 = w2 * h2;
        const union_area = area1 + area2 - intersection_area;

        return intersection_area / union_area;
    }
}
