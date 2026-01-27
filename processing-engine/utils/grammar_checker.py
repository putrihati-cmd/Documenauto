from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
import re

class IndoGrammarAgent:
    def __init__(self):
        # Hemat RAM: Load Sastrawi cuma sekali saat start
        self.factory = StemmerFactory()
        self.stemmer = self.factory.create_stemmer()
        
        # Database Kata Tidak Baku (Bisa diperluas)
        self.typo_dict = {
            'gak': 'tidak',
            'ngga': 'tidak',
            'nggak': 'tidak',
            'gimana': 'bagaimana',
            'kalo': 'kalau',
            'krn': 'karena',
            'dgn': 'dengan',
            'yg': 'yang',
            'sy': 'saya',
            'aq': 'aku',
            'makasih': 'terima kasih',
            'bgt': 'banget'
        }

    def check(self, text):
        suggestions = []
        words = text.split()
        
        for index, word in enumerate(words):
            clean_word = re.sub(r'[^\w\s]','',word).lower() # Hapus tanda baca
            
            # 1. Cek Kata Tidak Baku
            if clean_word in self.typo_dict:
                suggestions.append({
                    'type': 'non_formal',
                    'original': word,
                    'suggestion': self.typo_dict[clean_word],
                    'position': index
                })
            
            # 2. Cek Redundansi (Contoh: "Sangat ... Sekali")
            if index < len(words) - 1:
                next_word_clean = re.sub(r'[^\w\s]','',words[index+1]).lower()
                bigram = f"{clean_word} {next_word_clean}"
                if bigram == "sangat sekali" or bigram == "agar supaya":
                    suggestions.append({
                        'type': 'redundant',
                        'original': bigram,
                        'suggestion': clean_word, # Pilih satu saja
                        'message': 'Pemborosan kata'
                    })

        return {
            "score": 100 - (len(suggestions) * 2), # Nilai asal
            "issues_count": len(suggestions),
            "details": suggestions
        }

# Test Direct Run
if __name__ == "__main__":
    agent = IndoGrammarAgent()
    sample = "Gimana kabarnya? Sy harap baik bgt ya. Jangan lupa makan agar supaya sehat."
    print(agent.check(sample))
