import ExpoModulesCore
import Foundation

public class AnythingLibraryAccessModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AnythingLibraryAccess")

    Function("bookmarkFolder") { (uri: String) -> String? in
      guard let url = URL(string: uri) else { return nil }
      
      // We must start accessing to create a bookmark if it's security-scoped
      let accessed = url.startAccessingSecurityScopedResource()
      defer { if accessed { url.stopAccessingSecurityScopedResource() } }
      
      do {
        let bookmark = try url.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
        return bookmark.base64EncodedString()
      } catch {
        print("AnythingLibraryAccess: Error creating bookmark: \(error)")
        return nil
      }
    }

    Function("resolveBookmark") { (base64: String) -> String? in
      guard let data = Data(base64Encoded: base64) else { return nil }
      
      do {
        var isStale = false
        let url = try URL(resolvingBookmarkData: data, options: .withoutUI, relativeTo: nil, bookmarkDataIsStale: &isStale)
        
        // Start accessing the resource. We deliberately do NOT stop accessing it,
        // so that the rest of the app (like expo-file-system) can use the string URI
        // to read/write files for the duration of the app session.
        _ = url.startAccessingSecurityScopedResource()
        
        return url.absoluteString
      } catch {
        print("AnythingLibraryAccess: Error resolving bookmark: \(error)")
        return nil
      }
    }
  }
}
