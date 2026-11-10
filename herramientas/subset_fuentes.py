from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer
import io,os,sys
U=list(range(0x20,0x7F))+list(range(0xA0,0x100))+[0x2013,0x2014,0x2018,0x2019,0x201C,0x201D,0x2026,0x2022,0x2212,0x20AC]
def make(src,limits,out):
    f=TTFont(src); f.flavor=None
    o=subset.Options(); o.layout_features=['kern','liga','ccmp','locl','mark','mkmk','calt','onum','lnum','tnum','pnum']; o.name_IDs=[]; o.notdef_outline=True; o.hinting=False; o.desubroutinize=True
    s=subset.Subsetter(o); s.populate(unicodes=U); s.subset(f)
    b=io.BytesIO(); f.save(b); b.seek(0); f=TTFont(b)
    if limits: f=instancer.instantiateVariableFont(f,limits)
    f.flavor='woff2'; f.save(out); print(out,os.path.getsize(out))
if __name__=='__main__':
    make('f0.woff2',{'wght':(400,600)},'hanken.woff2')
    make('f4.woff2',{'wght':(400,500)},'news.woff2')
    make('f3.woff2',None,'newsi.woff2')
