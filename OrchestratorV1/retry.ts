import { IRetryOptions } from "./interfaces";

// tslint:disable-next-line:ban-types
export function Retry(options: IRetryOptions): Function {

    // tslint:disable-next-line:only-arrow-functions
    return function(target: any, name: string, descriptor: TypedPropertyDescriptor<any>) {

        const originalMethod: any = descriptor.value;

        descriptor.value = async function(...args: any[]) {

            try {

                return await retryAsync.apply(this, [originalMethod, args, options.attempts, options.timeout]);

            } catch (e) {

                e.message = `Failed retrying ${name} for ${options.attempts} times`;

                throw e;

            }
        };

        return descriptor;

    };

    // tslint:disable-next-line:ban-types
    async function retryAsync(target: Function, args: any[], attempts: number, timeount: number): Promise<any> {

        try {

            return await target.apply(target, args);

        } catch (e) {

            if (--attempts < 0) {

                throw new Error(e);

            }

            await new Promise((resolve) => setTimeout(resolve, timeount));

            return retryAsync.apply(target, [target, args, attempts, timeount]);

        }

    }

}