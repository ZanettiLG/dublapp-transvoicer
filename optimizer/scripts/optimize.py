import onnx
from onnxoptimizer import optimize

model = onnx.load("modelo.onnx")
passes = ["extract_constant_to_initializer", "eliminate_unused_initializer"]
optimized_model = optimize(model, passes)
onnx.save(optimized_model, "modelo_otimizado.onnx")
