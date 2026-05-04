---
title: Main PC
publish: "true"
---
My main workhorse PC. I do all of my shit on this bad boy. It was originally built in 2023 with a r9 7900 and with air cooling in mind. However, overtime I transferred the build into dan a4h20, converting the build to a water-cooling setup. I've also switched the sata SSDs for a full M2 setup, as well as recently swapping the r9 7900 for an r7 7800x3d. 
# Current hardware 
- 7800x3d
- 7900xtx
- MSI b650i EDGE wifi
- 32gb Flare X5 5600 cl30
- Kioxia *KBG50ZNV512G* 512gb + XPG S70 BLADE 2tb
- EKWB Nucleus 240
- Dan a4h20
- SF750

![[Pasted image 20260504172329.png]]
![[Pasted image 20260504173313.png]]
![[Pasted image 20260504173320.png]]
*Comparison with the old build in the NZXT h200*

![[Pasted image 20260504174849.png]]
![[Pasted image 20260504174437.png]]
*The setup can be seen in the background, already transferred to Dan a4h20*

![[Pasted image 20260504174533.png]]
![[Pasted image 20260504175407.png]]

![[Pasted image 20260504181026.png]]
![[Pasted image 20260504181040.png]]

---
The setup has been running CachyOS since late summer 2025 and I couldn't be happier. I did recently dual-boot the system, however I do not have a lot of uses for the Windows 10 LTSC for now. I use [DMS](https://danklinux.com/) as my dot-files, since I could not be bothered to configure Hyprland myself. The theming is achieved through Matugen, most of the stuff works out of the box. I would like to point out a couple of configs though. Discord and Obsidian are both themed in according with this [repo](https://github.com/InioX/matugen-themes). Steam is themed through Millenium and Material theme. The aforementioned repo does have the config for Steam Adwaita, however I don't like the look and I don't like having "GNOME like" stuff on my PC. The later is quite ironic, since I use Nautilus as my file explorer. 
# Current software
- CachyOS; installed with no desktop and some of the default packages removed
- [DMS](https://danklinux.com/); just installed with the automated script
- Matugen; color theming
- Millennium Steam client
- Vesktop Discord client
- Zen browser
- LACT for GPU overclock and under-volt

![[Pasted image 20260504184248.png]]
*Light theme*
![[Pasted image 20260504184357.png]]
*Dark theme*

---
I am a tinkerer by nature, I wouldn't be myself if I didn't overclock this bad boy. Unfortunately I did have a lot of instability with this build. I will not bother you with all the stuff I investigated, so yeah 750 watts is not in fact enough for a 7900xtx. I am planning on replacing the PSU with a 1000w one, you can check out the Planned section below for that. For now the GPU runs under-clocked and under-volted, which from what I can tell, does not actually cost me any performance. 

![[Pasted image 20260504180128.png]]
*PSU troubleshooting process*
# Overclock config
- CPU runs -30 all cores. iGPU turned off.
- RAM for now just runs on expo, so 5600 cl30. I would like to experiment, since the chips technically should be fine for 6000 cl30
- GPU temp config. 272w power limit, 2300Mhz Max clock, 2500Mhz Max VRAM clock, -50Mv Under-volted

As with any of my builds this is a sort of a "Ship of Theseus", I occasionally modify and modernize it. You can see the current plan below:
# Planned changes
- ~~CPU: 7800x3d.~~ 306 EUR
- Single bottom fan: NF-A12x15. Already have 2. *If it fits that is.* 
- Double fans for AIO: 2xNf-a12x25 G2, 65 EUR Each on Kupujem. 
- Side panels: [Here](https://jakefacecustoms.myshopify.com/cart).  105 EUR
- Loki 1000w. Since I need a PSU for [[The server]] and I have narrowed down the instability of this build down to my PSU
