import os
import sys
import onnx


def remove_unused_initializers(model_path, output_path):
    # Carregar o modelo ONNX
    model = onnx.load(model_path)

    # Coletar inicializadores utilizados
    used_initializers = set()
    for node in model.graph.node:
        used_initializers.update(node.input)

    # Criar uma nova lista de inicializadores sem os não utilizados
    new_initializers = [
        initializer
        for initializer in model.graph.initializer
        if initializer.name in used_initializers
    ]

    # Atualizar o modelo
    del model.graph.initializer[:]
    model.graph.initializer.extend(new_initializers)

    # Salvar o modelo simplificado
    onnx.save(model, output_path)
    print(f"Modelo salvo em: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 simplify_all_onnx.py <diretório>")
        sys.exit(1)

    remove_unused_initializers(sys.argv[1], sys.argv[2])
