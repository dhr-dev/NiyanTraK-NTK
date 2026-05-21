@echo off
mkdir transparent 2>nul

for %%f in (*.png *.jpg *.jpeg) do (
    echo Processing %%f
    py -c "from rembg import remove; from PIL import Image; import numpy as np; i=Image.open(r'%%f'); o=remove(i); arr=np.array(o); alpha=arr[:,:,3]; alpha[alpha<200]=0; alpha[alpha>=200]=255; arr[:,:,3]=alpha; Image.fromarray(arr).save(r'transparent\%%~nf.png')"
)

echo Done!
pause