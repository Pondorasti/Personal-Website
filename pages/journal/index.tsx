import { useState, useRef } from "react"
import Link from "next/link"
import fs from "fs"
import * as matter from "gray-matter"
import Description from "@components/Description"
import { IMeta } from "@lib/types"
import classNames from "@lib/classNames"
import { formatDate } from "@lib/date"

interface IJournal {
  slugs: string[]
  metas: IMeta[]
}

// Inspiration: https://emilkowal.ski/ui/tabs
export default function Journal({ slugs, metas }: IJournal): JSX.Element {
  const [highlightedTab, setHighlightedTab] = useState<HTMLElement | null>(null)
  const [isHoveredFromNull, setIsHoveredFromNull] = useState(true)
  const [transform, setTransform] = useState("translate(0, 0")

  const parentRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const cardStyle = "flex flex-col px-4 py-6 relative"
  const asideStyle =
    "absolute [writing-mode:vertical-rl] h-[104px] top-0 -left-12 pr-11 font-serif text-center text-sm text-gray-300"

  function handleMouseOver(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    const node = event.target as HTMLElement
    const parent = parentRef.current!

    setIsHoveredFromNull(!highlightedTab)
    setHighlightedTab(node)

    const tabBoundingBox = node.getBoundingClientRect()
    const parentBoundingBox = parent.getBoundingClientRect()
    const highlightOffset = tabBoundingBox.top - parentBoundingBox.top

    // exit early if event triggered by children
    if (node.className === cardStyle || node.className === asideStyle) {
      setTransform(`translate(0, ${highlightOffset}px)`)
    }
  }

  return (
    <>
      <Description title="Journal" description="A collection of random thoughts" />

      <div className="ml-12 md:ml-0">
        {/* Book Binding */}
        <div className="fixed border-l-2 border-divider border-dotted h-full -ml-4 top-0" />

        {/* Highlighter */}
        <div ref={parentRef} className="relative" onMouseLeave={() => setHighlightedTab(null)}>
          <div
            ref={highlightRef}
            className={classNames(
              "w-full absolute h-[104px]",
              "!duration-200",
              isHoveredFromNull ? "!transition-none" : "!transition-transform "
            )}
            style={{ transform }}
          >
            <div
              className={classNames(
                "highlight h-full w-full rounded-xl",
                !!highlightedTab ? "opacity-100" : "opacity-0",
                "!transition-opacity !duration-200"
              )}
            />
          </div>

          {/* Entries */}
          {metas.map((meta, index) => (
            <Link key={slugs[index]} href={`/journal/${slugs[index]}`} passHref>
              <a className={cardStyle} onMouseOver={handleMouseOver}>
                <aside className={asideStyle} onMouseOver={handleMouseOver}>
                  {formatDate(new Date(meta.publishedAt), false)}
                </aside>
                <h2 className="text-xl font-semibold">{meta.title}</h2>
                <p className="mt-2 text-sm text-gray-400">{meta.description}</p>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const fileNames = fs.readdirSync("./data/journal")
  const slugs = fileNames.map((fileName) => fileName.replace(/\.mdx$/, ""))
  const metas = await Promise.all(
    fileNames.map(async (fileName) => matter.read(`./data/journal/${fileName}`).data as IMeta)
  )

  return { props: { slugs, metas } }
}
