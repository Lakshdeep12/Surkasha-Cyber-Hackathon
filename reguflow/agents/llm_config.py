import os
from langchain_community.chat_models import ChatOllama

def get_llm(model_name="llama3"):
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    # For JSON output format, many Ollama models support it via format="json"
    llm = ChatOllama(model=model_name, base_url=base_url, format="json", temperature=0)
    return llm
