import { Portal } from "@radix-ui/react-portal"

export const DebugStateMessages = ({
  messages
}: {
  messages: (string | false | null)[]
}) => {
  return (
    <Portal>
      <div className="fixed bottom-0 right-0 flex">
        {messages.map(
          (m, i) =>
            m && (
              <div
                className="flex items-center h-6 px-2 font-mono text-sm text-white uppercase bg-gray-900 gap-x-2"
                key={i}
              >
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" />
                <span>{m}</span>
              </div>
            )
        )}
      </div>
    </Portal>
  )
}
