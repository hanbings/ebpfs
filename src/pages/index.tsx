import {Inter} from 'next/font/google'
import Navbar from "@/pages/components/Navbar";
import Button from "@/pages/components/Button";
import {State} from "@/pages/_app";
import Input from "@/pages/components/Input";
import {useState} from "react";
import {useRouter} from "next/router";
import Message from "@/common/message";
import {Account} from "@/common/account";
import {Token} from "@/common/token";

const inter = Inter({subsets: ['latin']})

interface LoginResponse {
    account: Account;
    token: Token;
}

export default function Home() {
    const router = useRouter();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const login = () => {
        fetch('/api/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                })
            })
            .then(res => res.json())
            .then(res => {
                let data = res as Message<LoginResponse | string>;

                console.log(data);

                if (data.status === 200) {
                    let re = res as Message<LoginResponse>;
                    State.token = re.data.token;
                    State.account = re.data.account;

                    return router.push('/account').then(() => {
                    });
                }

                if (data.status === 302) {
                    let re = res as Message<string>;

                    return router.push(re.data).then(() => {
                    });
                }
            });
    }

    return (
        <main style={{backgroundImage: `url("https://i.im.ge/2023/07/17/5jrzzK.F0ci1uZakAAukOL.jpg")`}}
              className={`flex min-h-screen flex-col ${inter.className} bg-fixed bg-cover bg-center`}>
            <Navbar
                src={State.account?.avatar ? State.account.avatar : `https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png`}/>
            <div className="min-h-screen w-full backdrop-blur-2xl flex flex-row gap-32 items-center justify-center">
                <div className="flex flex-col gap-2">
                    <img src="favicon.ico" alt="" style={{height: "72px"}} width="72"/>
                    <p className="text-3xl text-gray-600">欢迎使用 eBPF Hub</p>
                    <p className="text-xl text-gray-600">搜索、探索 eBPF 程序</p>
                </div>
                <div className="mt-2">
                    {
                        State.isLogin()
                            ? <Button icon="icons8-github.svg" href="/account" text="查看账号"/>
                            : <div className="mt-2">
                                <div className="bg-white flex flex-col flex-wrap gap-4 p-16 rounded-2xl"
                                     style={{width: '480px'}}>
                                    <p className="font-bold text-xl"></p>
                                    <Input placeholder="邮箱（未注册将自动注册）" height="48px" width="350px"
                                           onChange={setEmail}
                                           onEnterPress={() => {
                                           }}/>
                                    <Input placeholder="密码" height="48px" width="350px" onChange={setPassword}
                                           onEnterPress={() => {
                                           }}/>
                                    <Button text="登录" onclick={login}/>
                                    <Button icon="icons8-github.svg" text="使用 Github 登录" href="/api/oauth"/>
                                </div>
                            </div>
                    }
                </div>
            </div>
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="flex flex-col shadow-xl p-16 gap-8 rounded-xl"
                     style={{width: '90%', minHeight: '500px'}}>
                    <p className="text-3xl">eBPF 搜索统计 / 趋势</p>
                    <div className="flex flex-row items-center justify-center gap-16">
                        <div className="shadow-xl rounded-xl" style={{width: '48%', height: '320px'}}>

                        </div>
                        <div className="shadow-xl rounded-xl" style={{width: '48%', height: '320px'}}>

                        </div>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-16 mt-8">
                        <div className="shadow-xl rounded-xl" style={{width: '380px', height: '320px'}}>

                        </div>
                        <div className="shadow-xl rounded-xl" style={{width: '380px', height: '320px'}}>

                        </div>
                        <div className="shadow-xl rounded-xl" style={{width: '380px', height: '320px'}}>

                        </div>
                        <div className="shadow-xl rounded-xl" style={{width: '380px', height: '320px'}}>

                        </div>
                        <div className="shadow-xl rounded-xl" style={{width: '380px', height: '320px'}}>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
