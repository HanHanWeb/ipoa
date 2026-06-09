import { Card, CardContent } from "@/components/ui/card";

const IMG_BASE = "https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/pw";

interface Judge {
  name: string;
  title: string;
  avatar: string;
  border: string;
}

const judges: Judge[] = [
  { name: "安逸", title: "「安逸PPT」账号主理人，金山最具价值专家(KVP)，微软国际办公认证MOS-PPT专家，51PPT模板网大设计师", avatar: `${IMG_BASE}/anyi.jpg`, border: "hover:border-blue-200" },
  { name: "Beetroot_", title: "圈内知名创作者", avatar: `${IMG_BASE}/beetroot.jpg`, border: "hover:border-emerald-200" },
  { name: "失窗", title: "圈内知名创作者", avatar: `${IMG_BASE}/shichuang.jpg`, border: "hover:border-purple-200" },
  { name: "LenkMat_临空牧野", title: "圈内知名创作者", avatar: `${IMG_BASE}/lenkmat.jpg`, border: "hover:border-orange-200" },
  { name: "Luca", title: "圈内知名创作者", avatar: `${IMG_BASE}/luca.jpg`, border: "hover:border-cyan-200" },
  { name: "戌犬朱狼_Lipus", title: "圈内知名创作者", avatar: `${IMG_BASE}/lipus.jpg`, border: "hover:border-rose-200" },
  { name: "空靈・灵", title: "圈内知名创作者", avatar: `${IMG_BASE}/kong.jpg`, border: "hover:border-indigo-200" },
  { name: "2333", title: "圈内知名创作者", avatar: `${IMG_BASE}/2333.jpg`, border: "hover:border-amber-200" },
  { name: "由崎かいと", title: "圈内知名创作者", avatar: `${IMG_BASE}/youqi.jpg`, border: "hover:border-teal-200" },
];

export function JudgesSection() {
  return (
    <section className="relative bg-[#fafafa] py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium tracking-widest text-[#38b6ff] uppercase">
            Judges
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            评委展示
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            圈内知名创作者组成的评审团，为每一份作品把关
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {judges.map((judge) => (
            <Card
              key={judge.name}
              className={`group border-slate-200/80 bg-white py-0 transition-colors duration-200 ${judge.border}`}
            >
              <CardContent className="flex items-center gap-4 px-4 py-3.5">
                <img
                  src={judge.avatar}
                  alt={judge.name}
                  className="size-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {judge.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">{judge.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
