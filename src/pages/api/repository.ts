import type {NextApiRequest, NextApiResponse} from 'next'
import Message from "@/common/message";
import CacheService from "@/services/cache";
import {Token} from "@/common/token";
import {Repository} from "@/common/repository";
import DatabaseService from "@/services/database";
import SearchService from "@/services/search";

export default async function handler(req: NextApiRequest, res: NextApiResponse<{}>) {
    if (req.method === 'GET') {
        const {id} = req.query;

        const repositories = new DatabaseService();

        // 如果没有携带参数则按获取创建时间最新的 10 个仓库
        if (id === null || id === '') {
            res.status(200).json(
                new Message(
                    200,
                    'OK',
                    {repository: await repositories.readRepositoryByLimit(10) as Repository[]}
                )
            );

            return;
        }

        const repo = await repositories.readRepository(id as string) as Repository[];
        res.status(200).json(new Message(200, 'OK', {repository: repo}));
    } else if (req.method === 'POST') {
        // 根据 Token 获取账号 ID
        const header = req.headers['authorization'];

        if (header === undefined || header === null) {
            res.status(400).json(new Message(400, 'token is invalid.', null));
            return;
        }

        const tokens = new CacheService<Token>();
        const repositories = new DatabaseService();

        const token = await tokens.get(header as string) as Token;

        if (token === undefined || token === null) {
            res.status(400).json(new Message(400, 'token is invalid.', null));
            return;
        }

        // 解构 form-data
        const {
            update, organization, project,
            version, readme, type, repository,
            entry, author, tags
        }: Repository = req.body;

        // 初始化搜索服务
        const algoliaApplicationID = process.env.ALGOLIA_APPLICATION_ID;
        const algoliaAPIKey = process.env.ALGOLIA_API_KEY;

        if (!algoliaApplicationID) {
            res.status(500).json(new Message(500, 'ALGOLIA_APPLICATION_ID is not set', null));
            return;
        }

        if (!algoliaAPIKey) {
            res.status(500).json(new Message(500, 'ALGOLIA_API_KEY is not set', null));
            return;
        }

        const search = new SearchService(algoliaApplicationID, algoliaAPIKey);
        // 获取 readme
        const content = await fetch(readme).then(async (response) => response.text());

        // 检查是否已经存在
        const repos = await repositories.readRepositoryByOrganizationAndProject(organization, project) as Repository[];

        if (repos && repos.length !== 0) {
            let match = repos.filter((item) => item.account === token.belong);

            // 意味着仓库重名
            if (match && match.length !== 0) {
                res.status(400).json(new Message(400, 'repository is already exists.', null));
                return;
            }

            // 不重名则更新
            const repo = repos[0];

            await repositories.updateRepository(repo.id, {
                id: repo.id,
                account: repo.account,
                created: repo.created,
                update: new Date().getTime().toString(),
                organization: organization,
                project: project,
                version: version,
                readme: readme,
                type: type,
                repository: repository,
                entry: entry,
                author: author,
                tags: tags
            });

            await search.update({
                id: repo.id,
                url: repo.repository,
                organization: repo.organization,
                project: repo.project,
                readme: repo.readme,
                // 字符数量限制为 5000 避免触发 algolia 的限制阈值
                content: content.length > 5000
                    ? content.substring(0, 5000).replace(/\n/g, "")
                    : content.replace(/\n/g, ""),
                author: repo.author,
                tags: repo.tags
            });

            res.status(200).json(new Message(200, 'OK', repo));
            return;
        } else {
            const repo = new Repository(
                crypto.randomUUID(),
                token.belong,
                new Date().getTime().toString(),
                update,
                organization,
                project,
                version,
                readme,
                type,
                repository,
                entry,
                author,
                tags
            )

            await repositories.createRepository(repo);
            await search.upload({
                id: repo.id,
                url: repo.repository,
                organization: repo.organization,
                project: repo.project,
                readme: repo.readme,
                // 字符数量限制为 5000 避免触发 algolia 的限制阈值
                content: content.length > 5000
                    ? content.substring(0, 5000).replace(/\n/g, "")
                    : content.replace(/\n/g, ""),
                author: repo.author,
                tags: repo.tags
            });

            res.status(200).json(new Message(200, 'OK', repo));
        }
    } else res.status(400).json(new Message(400, 'request method not match.', null));
}