from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

# Usamos GPT-2 como modelo base (liviano para CPU)
base_model_name = "gpt2"

# Cargar tokenizer y modelo base
tokenizer = AutoTokenizer.from_pretrained(base_model_name)
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)

# Cargar el modelo con los pesos entrenados de LoRA
model = PeftModel.from_pretrained(base_model, "mi-lora/output")

# Mover a CPU (fundamental para evitar cuelgues)
model.to("cpu")

# Prompt de ejemplo (podés cambiar esto)
prompt = input("Escribí tu prompt: ")

# Tokenizar e inferir
inputs = tokenizer(prompt, return_tensors="pt").to("cpu")
outputs = model.generate(**inputs, max_new_tokens=100)

# Decodificar y mostrar la respuesta
print("\n=== Respuesta generada ===")
print(tokenizer.decode(outputs[0], skip_special_tokens=True))

