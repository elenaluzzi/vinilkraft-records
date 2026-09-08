import { animate, scrambleText } from 'https://esm.sh/animejs';

const title = document.querySelector('.retro-title');

animate(title, {
    innerHTML: scrambleText({
        text: 'Vinilkraft Records',
        duration: 1200,
        settleDuration: 600,
        from: 'left',
        cursor: '█',
    }),
    loop: true,
    loopDelay: 2500,
    delay: 400,
});