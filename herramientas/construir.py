#!/usr/bin/env python3
"""Genera index.html desde index.src.html: sustituye el <link> de Google Fonts por las tres
fuentes ya recortadas (latin + signos del español, solo los pesos que usa la página) incrustadas en base64.
Uso:  python herramientas/construir.py   (desde la carpeta landing)
Las fuentes se recortaron con herramientas/subset_fuentes.py a partir de las variables de Google Fonts."""
import re, base64, os
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
def b64(n): return base64.b64encode(open(os.path.join(aqui, 'fuentes', n), 'rb').read()).decode()
RANGO = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20AC,U+2212'
def cara(fam, estilo, peso, f):
    return ("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;"
            "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}") % (fam, estilo, peso, b64(f), RANGO)
estilo = '<style id="fuentes-incrustadas">\n' + '\n'.join([
    cara('Hanken Grotesk', 'normal', '400 600', 'hanken-grotesk-400-600.woff2'),
    cara('Newsreader', 'normal', '400 500', 'newsreader-400-500.woff2'),
    cara('Newsreader', 'italic', '400', 'newsreader-italic.woff2')]) + '\n</style>'
s = open(os.path.join(raiz, 'index.src.html'), encoding='utf-8').read()
n = len(re.findall(r'<link[^>]+href="https://fonts\.googleapis\.com/css2?[^"]+"[^>]*>', s))
if n != 1: raise SystemExit('Se esperaba 1 <link> de Google Fonts, hay %d' % n)
s = re.sub(r'<link[^>]+href="https://fonts\.googleapis\.com/css2?[^"]+"[^>]*>', lambda m: estilo, s)
open(os.path.join(raiz, 'index.html'), 'w', encoding='utf-8').write(s)
print('index.html generado (%d KB)' % (len(s.encode('utf-8')) // 1024))
