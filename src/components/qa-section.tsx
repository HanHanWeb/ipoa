import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QAItem {
  question: string;
  answer: string;
}

const qaList: QAItem[] = [
  {
    question: "什么是界面生态 PPTOS 创意设计大赛？",
    answer:
      "界面生态 PPTOS 创意设计大赛是由界面生态举办的纯公益在线赛事，旨在搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才。大赛全程不收取任何费用。",
  },
  {
    question: "如何参加比赛？",
    answer:
      "参赛需在规定时间内提交符合要求的 PPT OS 创意设计作品。具体参赛方式和作品要求请访问大赛详情页面了解。",
  },
  {
    question: "奖项设置是怎样的？",
    answer:
      "大赛设置一等奖（占总参赛作品的 10%）、二等奖（20%）、三等奖（30%）、优秀奖（40%）、黑马突围奖（3 名）以及人气之星（1 名，由社区投票产生）。各奖项均包含电子荣誉证书，部分奖项还包含优秀作品展示、社区周边、社区认证及创作激励奖金。",
  },
  {
    question: "参赛需要缴费吗？",
    answer:
      "不需要。本赛事为纯公益在线赛事，全程不收取任何费用。",
  },
];

export function QASection() {
  return (
    <section className="relative bg-white py-28 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium tracking-widest text-emerald-600 uppercase">
            Q &amp; A
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            常见问题
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            关于大赛的常见问题解答
          </p>
        </div>

        {/* Accordion */}
        <Accordion className="w-full">
          {qaList.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-slate-200/80"
            >
              <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:text-slate-700 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-slate-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
