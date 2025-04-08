import torch

dummy_input = torch.randn(1, 3, 224, 224)  # Exemplo de entrada
model = torch.load("seu_modelo.pth")
torch.onnx.export(
    model,
    dummy_input,
    "modelo_reexportado.onnx",
    opset_version=17,  # Use a versão mais recente suportada
    do_constant_folding=True,
)
