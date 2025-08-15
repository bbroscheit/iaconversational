from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import load_dataset
from peft import get_peft_model, LoraConfig, TaskType
import torch
import os

# Ruta a tu dataset
dataset_path = "dataset.jsonl"

# Cargamos el dataset
dataset = load_dataset("json", data_files=dataset_path, split="train")

# Modelo liviano para CPU
base_model = "gpt2"

# Cargar tokenizer y modelo base
tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model)

# Evitar errores si el tokenizer no tiene pad token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
    model.config.pad_token_id = tokenizer.pad_token_id

# Aplicamos LoRA al modelo
lora_config = LoraConfig(
    r=4,
    lora_alpha=16,
    target_modules=["c_attn"],  # Adaptado para GPT2
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)
model = get_peft_model(model, lora_config)

# Tokenizamos los datos
def tokenize_function(examples):
    texts = [p + " " + r for p, r in zip(examples["prompt"], examples["response"])]
    return tokenizer(texts, truncation=True, padding="max_length", max_length=256)

print(dataset.column_names)
tokenized_dataset = dataset.map(tokenize_function, batched=True)

# Parámetros de entrenamiento
training_args = TrainingArguments(
    output_dir="mi-lora/output",
    per_device_train_batch_size=1,  # más seguro para CPU
    num_train_epochs=1,             # probar con 1 para validar
    logging_steps=5,
    save_steps=50,
    save_total_limit=1,
    report_to="none",
    fp16=False,                     # ¡importante en CPU!
    no_cuda=True                   # fuerza CPU
)

# Collator
data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=data_collator,
)

# Entrenar
trainer.train()

# Guardar el modelo LoRA
trainer.save_model("mi-lora/output")


