import Gtk from "gi://Gtk";
import GLib from "gi://GLib";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";

export function logEnum(obj, value) {
  console.log(
    Object.entries(obj).find(([k, v]) => {
      return v === value;
    })[0],
  );
}

export function relativePath(path) {
  const [filename] = GLib.filename_from_uri(import.meta.url);
  const dirname = GLib.path_get_dirname(filename);
  return GLib.canonicalize_filename(path, dirname);
}

export function loadStyleSheet(path) {
  const provider = new Gtk.CssProvider();
  provider.load_from_path(path);
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );
}

export const settings = new Gio.Settings({
  schema_id: "re.sonny.Workbench",
  path: "/re/sonny/Workbench/",
});

// We are using postcss because it's also a dependency of prettier
// it would be great to keep the ast around and pass that to prettier
// so there is no need to re-parse but that's not supported yet
// https://github.com/prettier/prettier/issues/9114
// We are not using https://github.com/pazams/postcss-scopify
// because it's not compatible with postcss 8
function scopeStylesheet(style) {
  const ast = postcss.parse(style);

   for (const node of ast.nodes) {
     node.selector = ".workbench_output " + node.selector;
   }

  let str = ''
  postcss.stringify(ast, (s) => {
    str += s
  });
  return str;
}

function targetBuildable(code) {
  const tree = ltx.parse(code);

  const child = tree.children.find((child) => {
    if (typeof child === 'string') return false

    const class_name = child.attrs.class;
    if (!class_name) return false;

    const split = class_name.split(/(?=[A-Z])/);
    if (split.length < 2) return false;

    const [ns, ...rest] = split;
    const klass = imports.gi[ns]?.[rest.join('')];
    if (!klass) return false;

    // TODO: Figure out a better way to find out if a klass
    // inherits from GtkWidget
    const instance = new klass()
    if (typeof instance.get_parent !== 'function') return false

    return true;
  })

  if (!child) {
    return [null, '']
  }

  if (!child.attrs.id) {
    child.attrs.id = 'workbench_target';
  }

  return [child.attrs.id, tree.toString()]
}
