import struct,numpy as np,subprocess,wave
d=open('/mnt/user-data/uploads/musicbox1_spooky_waltz.mid','rb').read()
fmt,ntr,div=struct.unpack('>HHH',d[8:14]);pos=14
def vlq(b,i):
    v=0
    while True:
        c=b[i];i+=1;v=(v<<7)|(c&0x7f)
        if not c&0x80:return v,i
notes=[];tempos=[(0,500000)]
for t in range(ntr):
    assert d[pos:pos+4]==b'MTrk';ln=struct.unpack('>I',d[pos+4:pos+8])[0];tr=d[pos+8:pos+8+ln];pos+=8+ln
    i=0;tick=0;rs=None;active={}
    while i<len(tr):
        dt,i=vlq(tr,i);tick+=dt
        s=tr[i]
        if s==0xFF:
            mt=tr[i+1];l,j=vlq(tr,i+2)
            if mt==0x51:tempos.append((tick,int.from_bytes(tr[j:j+3],'big')))
            i=j+l;continue
        if s in(0xF0,0xF7):
            l,j=vlq(tr,i+1);i=j+l;continue
        if s&0x80:rs=s;i+=1
        st=rs;hi=st&0xF0;ch=st&0x0F
        if hi in(0xC0,0xD0):i+=1;continue
        a,b=tr[i],tr[i+1];i+=2
        if ch==9:continue
        if hi==0x90 and b>0:active.setdefault((ch,a),[]).append((tick,b))
        elif hi==0x80 or (hi==0x90 and b==0):
            q=active.get((ch,a))
            if q:
                st0,vel=q.pop(0);notes.append((st0,tick,a,vel,t))
tempos=sorted(set(tempos))
def sec(tk):
    s=0;lt=0;lp=500000
    for ttk,tp in tempos:
        if ttk>=tk:break
        s+=(ttk-lt)/div*lp/1e6;lt=ttk;lp=tp
    return s+(tk-lt)/div*lp/1e6
ev=[(sec(a),sec(b),n,v,t) for a,b,n,v,t in notes]
print(len(ev),'notes; tracks used',sorted({e[4] for e in ev}),'end',max(e[1] for e in ev),'tempos',tempos[:4])
sr=32000;end=max(e[1] for e in ev);TAIL=3.0
L=int(round((end+0.4)*sr))   # loop length (song + short pause)
buf=np.zeros(L+int(TAIL*sr+sr))
for s0,s1,n,v,t in ev:
    f=440*2**((n-69)/12);i0=int(s0*sr);dur=max(s1-s0,0.15)
    tau=2.2*(440/f)**0.45;tau=min(max(tau,0.35),3.0)
    N=int((min(tau*6,4.0))*sr);x=np.arange(N)/sr
    w=np.sin(2*np.pi*f*x)+0.30*np.sin(2*np.pi*f*2.01*x)*np.exp(-x/(tau*0.5))+0.16*np.sin(2*np.pi*f*3.99*x)*np.exp(-x/(tau*0.3))+0.07*np.sin(2*np.pi*f*5.43*x)*np.exp(-x/(tau*0.15))
    env=np.minimum(x/0.003,1)*np.exp(-x/tau)
    w=w*env*(v/127)**0.8*0.22
    e=min(i0+N,len(buf));buf[i0:e]+=w[:e-i0]
# reverb: parallel feedback combs
def comb(x,dl,g):
    y=x.copy()
    for k in range(dl,len(y)):y[k]+=g*y[k-dl]
    return y
dry=buf.copy()
wet=sum(comb(buf,int(sr*m),g) for m,g in [(0.0297,.72),(0.0371,.70),(0.0411,.68),(0.0437,.66)])/4
out=dry*0.75+wet*0.45
# wrap tail onto beginning for seamless loop
loop=out[:L].copy();tail=out[L:L+int(TAIL*sr)];loop[:len(tail)]+=tail[:L]
loop/=np.max(np.abs(loop))*1.15
pcm=(loop*32767).astype(np.int16)
w=wave.open('musicbox.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes());w.close()
print('loop seconds',L/sr)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','musicbox.wav','-codec:a','libmp3lame','-b:a','64k','musicbox.mp3'])
import os;print(os.path.getsize('musicbox.mp3')//1024,'KB mp3')
