import { ContentModel } from "../models/contentModel.js";

async function main()
{
    try {
        const allContent = await ContentModel.getById('68f53d7c80e46a59f3f102e9');
        console.log(allContent);
    }
    catch(err)
    {
        console.error('ERROR',err);
    }
    finally
    {
        process.exit();
    }
}
main();