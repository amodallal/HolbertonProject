from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os
import traceback
from datasets import load_dataset, Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

app = Flask(__name__)
CORS(app)

@app.route('/save', methods=['POST'])
def save():
    try:
        data = request.get_json(force=True)
        prompt = data.get("prompt")
        response = data.get("response")
        with open("training-data.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps({"prompt": prompt, "response": response}) + "\n")
        return jsonify({"message": "Saved!", "status": "success"}), 200
    except Exception as e:
        return jsonify({"message": str(e), "status": "error"}), 500

@app.route('/train', methods=['POST'])
def train():
    try:
        print("✅ Starting real fine-tuning...")

        # Load and clean the data
        with open("training-data.jsonl", "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f if line.strip()]

        # Prepare model & tokenizer
        model_name = "microsoft/phi-2"
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        tokenizer.pad_token = tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True)

        # Apply PEFT (LoRA)
        model = prepare_model_for_kbit_training(model)
        config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"], lora_dropout=0.05, bias="none", task_type="CAUSAL_LM")
        model = get_peft_model(model, config)

        # Tokenization
        def tokenize(sample):
            text = f"{sample['prompt']}\n###\n{sample['response']}"
            return tokenizer(text, truncation=True, padding='max_length', max_length=256)

        ds = ds.map(tokenize)

        # Training
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        output_dir = f"phi3-finetuned-{timestamp}"
        args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=2,
            save_steps=10,
            save_total_limit=1,
            logging_steps=5,
            report_to="none"
        )

        trainer = Trainer(model=model, args=args, train_dataset=ds)
        trainer.train()

        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)

        return jsonify({"message": f"Model saved in {output_dir}", "status": "success"}), 200

    except Exception as e:
        print("❌ Exception during fine-tuning:", e)
        traceback.print_exc()  # <--- Add this line
        return jsonify({"message": str(e), "status": "error"}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True)
