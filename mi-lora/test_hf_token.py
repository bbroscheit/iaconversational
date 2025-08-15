from huggingface_hub import HfApi

# Inicializar la API
api = HfApi()

# Obtener la información del usuario (requiere login previo o token en entorno)
try:
    user_info = api.whoami()
    print("✅ Login exitoso. Usuario:", user_info['name'])
except Exception as e:
    print("❌ Error al autenticar:", str(e))
