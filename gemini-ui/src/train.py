from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import get_peft_model, LoraConfig, TaskType
import torch

# Step 1: Load your training data from JSONL
print("✅ Loading dataset...")
dataset = load_dataset('json', data_files='training-data.jsonl')['train']

# Step 2: Load tokenizer and model (change to phi-3 when available)
print("✅ Loading tokenizer and base model...")
model_name = "microsoft/phi-2"
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16)

# Step 3: Tokenize your data
def tokenize(sample):
    prompt = sample["prompt"]
    response = sample["response"]
    text = f"### Question:\n{prompt}\n\n### Answer:\n{response}"
    return tokenizer(text, truncation=True, padding="max_length", max_length=512)

print("✅ Tokenizing dataset...")
dataset = dataset.map(tokenize, remove_columns=['prompt', 'response'])

# Step 4: Setup LoRA Config
print("✅ Applying LoRA (PEFT)...")
peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=16,
    lora_dropout=0.1,
    bias="none"
)
model = get_peft_model(model, peft_config)

# Step 5: Define training arguments
training_args = TrainingArguments(
    output_dir="./phi3-finetuned",
    per_device_train_batch_size=2,
    num_train_epochs=3,
    save_steps=50,
    logging_steps=10,
    fp16=True,
    report_to="none"
)

# Step 6: Train the model
print("🚀 Starting training...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset
)

trainer.train()

# Step 7: Save the model
print("💾 Saving fine-tuned model...")
model.save_pretrained("phi3-finetuned")
tokenizer.save_pretrained("phi3-finetuned")
print("✅ Done. Fine-tuned model saved to ./phi3-finetuned")
