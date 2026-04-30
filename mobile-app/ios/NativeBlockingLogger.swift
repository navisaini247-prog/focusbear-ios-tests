import Foundation

enum NativeBlockingLogger {
    private static let logsDirectoryName = "logs"
    private static let fileName = "focusbear-native-blocking.log"
    private static let logRetentionSeconds: TimeInterval = 24 * 60 * 60
    private static let pruneIntervalSeconds: TimeInterval = 60 * 60

    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let syncQueue = DispatchQueue(label: "com.focusbear.nativeblockinglogger")
    private static var lastLevel: String?
    private static var lastMessage: String?
    private static var suppressedRepeatCount = 0
    private static var duplicateSuppressionLineWritten = false
    private static var lastPruneTime: Date?

    static func info(_ message: String) {
        write(level: "INFO", message: message)
    }

    static func error(_ message: String) {
        write(level: "ERROR", message: message)
    }

    private static func write(level: String, message: String) {
        syncQueue.sync {
            do {
                let fileURL = try logFileURL()
                let isSameAsPrevious = level == lastLevel && message == lastMessage

                if isSameAsPrevious {
                    suppressedRepeatCount += 1
                    if !duplicateSuppressionLineWritten {
                        append(line: buildLine(level: "INFO", message: "... duplicate native blocking logs suppressed for this message"), to: fileURL)
                        duplicateSuppressionLineWritten = true
                    }
                    return
                }

                maybePruneExpiredLines(at: fileURL)

                if duplicateSuppressionLineWritten && suppressedRepeatCount > 0 {
                    append(
                        line: buildLine(level: "INFO", message: "... previous native blocking log repeated \(suppressedRepeatCount) more times"),
                        to: fileURL
                    )
                }

                suppressedRepeatCount = 0
                duplicateSuppressionLineWritten = false
                lastLevel = level
                lastMessage = message

                append(line: buildLine(level: level, message: message), to: fileURL)
            } catch {
                print("[NativeBlockingLogger] Failed to write log: \(error.localizedDescription)")
            }
        }
    }

    /// Drops lines older than 24h (aligned with Android). Throttled to at most once per hour to limit I/O.
    private static func maybePruneExpiredLines(at url: URL) {
        let now = Date()
        if let last = lastPruneTime, now.timeIntervalSince(last) < pruneIntervalSeconds {
            return
        }
        lastPruneTime = now
        pruneExpiredLines(at: url)
    }

    private static func pruneExpiredLines(at url: URL) {
        guard FileManager.default.fileExists(atPath: url.path) else { return }

        guard let data = try? Data(contentsOf: url),
              let text = String(data: data, encoding: .utf8), !text.isEmpty
        else { return }

        let cutoff = Date().addingTimeInterval(-logRetentionSeconds)
        let lines = text.components(separatedBy: .newlines)
        var retained: [String] = []
        retained.reserveCapacity(lines.count)
        var droppedAny = false

        for line in lines {
            if line.isEmpty {
                continue
            }
            if let ts = parseLineTimestamp(line) {
                if ts >= cutoff {
                    retained.append(line)
                } else {
                    droppedAny = true
                }
            } else {
                retained.append(line)
            }
        }

        if !droppedAny {
            return
        }

        let newContent = retained.joined(separator: "\n") + (retained.isEmpty ? "" : "\n")
        do {
            try newContent.write(to: url, atomically: true, encoding: .utf8)
        } catch {
            print("[NativeBlockingLogger] Failed to prune log: \(error.localizedDescription)")
        }
    }

    private static func parseLineTimestamp(_ line: String) -> Date? {
        guard let range = line.range(of: " [") else { return nil }
        let prefix = String(line[..<range.lowerBound])
        return isoFormatter.date(from: prefix)
    }

    private static func logFileURL() throws -> URL {
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
        guard let documentsURL else {
            throw NSError(domain: "NativeBlockingLogger", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Document directory unavailable"
            ])
        }
        let logsDirectory = documentsURL.appendingPathComponent(logsDirectoryName, isDirectory: true)
        if !FileManager.default.fileExists(atPath: logsDirectory.path) {
            try FileManager.default.createDirectory(at: logsDirectory, withIntermediateDirectories: true)
        }
        return logsDirectory.appendingPathComponent(fileName)
    }

    private static func append(line: String, to url: URL) {
        if !FileManager.default.fileExists(atPath: url.path) {
            FileManager.default.createFile(atPath: url.path, contents: nil)
        }

        guard let data = line.data(using: .utf8) else { return }

        do {
            let handle = try FileHandle(forWritingTo: url)
            defer { try? handle.close() }
            try handle.seekToEnd()
            try handle.write(contentsOf: data)
        } catch {
            print("[NativeBlockingLogger] Failed to append log: \(error.localizedDescription)")
        }
    }

    private static func buildLine(level: String, message: String) -> String {
        let timestamp = isoFormatter.string(from: Date())
        return "\(timestamp) [\(level)] [NATIVE_BLOCKING] \(message)\n"
    }
}
