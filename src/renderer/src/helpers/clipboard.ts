import Clipboard from "clipboard";

interface Options {
    appendToBody: boolean
}

export default (options: Options) => {
    const appendToBody = options.appendToBody === undefined ?? true;

    return {
        toClipboard: (text: string, container?: HTMLElement) => {
            return new Promise((res, rej) => {
                const el = document.createElement('button');
                const cp = new Clipboard(el, {
                    text: () => text,
                    action: () => 'copy',
                    container: container ?? document.body,
                });

                cp.on('success', (e) => {
                    cp.destroy();
                    res(e);
                });

                cp.on('error', (e) => {
                    cp.destroy();
                    rej(e);
                });
                
                if (appendToBody) document.body.appendChild(el);
                el.click();

                if (appendToBody) document.body.removeChild(el);
            });
        } 
    };
};