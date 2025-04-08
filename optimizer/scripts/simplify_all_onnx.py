import os
import sys
from onnxsim import simplify
import onnx
from onnxoptimizer import optimize


def simplify_onnx_files(directory):
    # Verificar se o diretório existe
    if not os.path.exists(directory):
        print(f"Erro: Diretório {directory} não encontrado.")
        sys.exit(1)

    # Processar todos os arquivos .onnx no diretório
    for filename in os.listdir(directory):
        if filename.endswith(".onnx"):
            filepath = os.path.join(directory, filename)
            print(f"Simplificando: {filepath}")

            # Carregar o modelo ONNX
            try:
                simplified_model, check = simplify(filepath)

                if not check:
                    print(f"Atenção: Simplificação falhou para {filepath}")
                    continue

                # Salvar o modelo simplificado
                output_path = os.path.join(
                    directory, filename.replace(".onnx", "_simplified.onnx")
                )
                with open(output_path, "wb") as f:
                    f.write(simplified_model.SerializeToString())
                print(f"Modelo simplificado salvo em: {output_path}")

                model = onnx.load(output_path)
                passes = [
                    "extract_constant_to_initializer",
                    "eliminate_unused_initializer",
                ]
                optimized_model = optimize(model, passes)

                final_path = os.path.join(
                    directory,
                    output_path.replace("_simplified.onnx", "_optimized.onnx"),
                )
                onnx.save(
                    optimized_model,
                    final_path,
                )
                print(f"Modelo otimizado salvo em: {final_path}")

            except Exception as e:
                print(f"Erro ao simplificar {filepath}: {e}")


if __name__ == "__main__":
    models_paths = [
        "models/Xenova/nllb-200-distilled-600M/onnx",
    ]

    for model_path in models_paths:
        simplify_onnx_files(model_path)
