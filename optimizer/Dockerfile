# Usar uma imagem base com Python 3
FROM python:3.9-slim

# Instalar dependências
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Instalar o onnx-simplifier
RUN pip install --no-cache-dir onnx-simplifier
RUN pip install --upgrade torch torchvision onnx
RUN pip install --no-cache-dir onnxoptimizer
# Criar um diretório de trabalho
WORKDIR /app

# Copiar o script Python para o container
COPY scripts /app/scripts

# Comando padrão para o container
#ENTRYPOINT ["python3", "/app/simplify_all_onnx.py"]

ENTRYPOINT ["tail", "-f", "/dev/null"]