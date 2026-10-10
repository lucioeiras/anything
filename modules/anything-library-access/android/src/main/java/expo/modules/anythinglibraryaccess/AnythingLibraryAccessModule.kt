package expo.modules.anythinglibraryaccess

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AnythingLibraryAccessModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AnythingLibraryAccess")

    Function("extractEntitiesAndTags") { _: String ->
      emptyList<String>()
    }
  }
}
