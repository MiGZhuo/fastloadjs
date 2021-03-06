import { sleep } from './utils/util'
export default class {

    private stream: ReadableStream

    private index: number = 0
    private dataMap: Object = {}
    private dataMapArray: Array<any> = []

    private destroyed: boolean;

    constructor(private init: ResponseInit, private order: boolean) {
        const _this = this;
        const process = async (c: ReadableStreamDefaultController) => {
            const { data, done, err } = await _this.get()
            if (err) {
                c.error(err)
                return
            }
            if (data) {
                c.enqueue(new Uint8Array(data))
            }
            if (done) {
                c.close()
            }
        }
        this.stream = new ReadableStream({
            async start(c: ReadableStreamDefaultController) {
                await process(c)
            },
            async pull(c: ReadableStreamDefaultController) {
                await process(c)
            }
        })
    }

    private async get() {
        while (true) {
            if (this.destroyed) {
                return { done: true }
            }
            let r: any;
            if (this.order) {
                r = this.dataMap[this.index]
            } else {
                r = this.dataMapArray[this.index]
            }
            if (!r) {
                await sleep(1000)
                continue
            }
            this.index++
            return r
        }
    }

    destroy() {
        this.destroyed = true;
    }

    // 提供任意seek能力,方便cachefill
    item(index: number) {
        return this.dataMap[index]
    }

    push(index: number, data: Object) {
        this.dataMap[index] = data
        this.dataMapArray.push(data)
    }

    getResponse() {
        return new Response(this.stream, this.init);
    }

}