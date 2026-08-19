import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAsync } from "@/hooks/useAsync";
import { fetchCompanies, fetchProducts, submitPitch } from "@/lib/queries";
import { readableError } from "@/lib/supabase";
import { useSeo } from "@/lib/seo";
import { slugify } from "@/lib/format";
import { ErrorState } from "@/components/pitchme/states";

const TITLE_MAX = 120;
const BODY_MAX = 2000;

export default function Submit() {
  useSeo({
    title: "Pitch a feature | PitchMe",
    description:
      "Describe the feature a product is missing. No account needed. Once reviewed, your pitch goes public and starts collecting supporters.",
    path: "/submit",
  });

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const companies = useAsync(() => fetchCompanies(), []);

  const [companyId, setCompanyId] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [productId, setProductId] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const preselected = params.get("company");
  const resolvedCompanyId = useMemo(() => {
    if (companyId) return companyId;
    if (companyId === "__new__") return "";
    if (!preselected) return "";
    return (companies.data ?? []).find((c) => c.slug === preselected)?.id ?? "";
  }, [companyId, preselected, companies.data]);

  const customCompany = companyId === "__new__";
  const activeCompanyId = customCompany ? "" : resolvedCompanyId;

  const products = useAsync(
    async () => (activeCompanyId ? fetchProducts(activeCompanyId) : []),
    [activeCompanyId],
  );

  const errors = {
    company: customCompany
      ? newCompany.trim().length >= 2
        ? ""
        : "Name the company this is about."
      : activeCompanyId
        ? ""
        : "Choose the company this is about.",
    product:
      productId || newProduct.trim() ? "" : "Choose a product or name the one that is missing.",
    title: title.trim().length >= 8 ? "" : "Give the pitch a title of at least 8 characters.",
    body: body.trim().length >= 30 ? "" : "Describe the feature in at least 30 characters.",
  };
  const valid = Object.values(errors).every((value) => value === "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || busy) {
      toast.error("Please complete the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      await submitPitch({
        company_id: customCompany ? null : activeCompanyId,
        new_company_name: customCompany ? newCompany.trim() : null,
        product_id: customCompany ? null : productId || null,
        new_product_name: !customCompany && productId ? null : newProduct.trim() || null,
        title: title.trim(),
        body: body.trim(),
        suggested_slug: slugify(title),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(readableError(error, "Your pitch could not be submitted. Please try again."));
    } finally {
      setBusy(false);
    }
  }


  if (done) {
    return (
      <div className="shell flex min-h-[60vh] max-w-2xl flex-col justify-center py-16">
        <p className="eyebrow">Submitted</p>
        <h1 className="display mt-3 text-3xl">Thanks. Your pitch is in the review queue.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A moderator checks every pitch before it goes public, usually within a day. Once it is
          published it will appear in Discover and start collecting supporters.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setTitle("");
              setBody("");
            }}
            className="min-h-11 rounded-md border border-border-strong px-5 text-sm font-medium transition-colors hover:bg-surface"
          >
            Pitch another
          </button>
          <button
            type="button"
            onClick={() => navigate("/discover")}
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-all hover:brightness-105"
          >
            Browse pitches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell max-w-3xl py-12">
      <header>
        <p className="eyebrow">Submit</p>
        <h1 className="display mt-3 text-3xl md:text-4xl">Pitch a feature</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Be specific about the problem and who it affects. Concrete pitches gather support faster
          and are far easier for a company to act on.
        </p>
      </header>

      {companies.error ? (
        <div className="mt-8">
          <ErrorState error={companies.error} onRetry={companies.reload} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-8">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-foreground">
            Company
          </label>
          <select
            id="company"
            value={customCompany ? "__new__" : resolvedCompanyId}
            onChange={(event) => {
              setCompanyId(event.target.value);
              setProductId("");
            }}
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
          >
            <option value="">Select a company</option>
            {(companies.data ?? []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
            <option value="__new__">Company not listed</option>
          </select>

          {customCompany ? (
            <div className="mt-3">
              <label htmlFor="new-company" className="block text-xs text-subtle-foreground">
                Name the company. A moderator verifies it and fills in the logo, website and
                description before it appears in the directory.
              </label>
              <input
                id="new-company"
                value={newCompany}
                maxLength={80}
                onChange={(event) => setNewCompany(event.target.value)}
                placeholder="For example: Linear"
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none"
              />
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="product" className="block text-sm font-medium text-foreground">
            Product
          </label>
          {customCompany ? null : (
            <select
              id="product"
              value={productId}
              disabled={!activeCompanyId}
              onChange={(event) => setProductId(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-border-strong focus:outline-none disabled:opacity-60"
            >
              <option value="">
                {activeCompanyId ? "Select a product" : "Choose a company first"}
              </option>
              {(products.data ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          )}

          {(customCompany || activeCompanyId) && !productId ? (
            <div className="mt-3">
              <label htmlFor="new-product" className="block text-xs text-subtle-foreground">
                {customCompany
                  ? "Which product is this about?"
                  : "Product not listed? Name it and a moderator will add it."}
              </label>
              <input
                id="new-product"
                value={newProduct}
                maxLength={60}
                onChange={(event) => setNewProduct(event.target.value)}
                placeholder="For example: Mobile app"
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none"
              />
            </div>
          ) : null}
        </div>


        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="title"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Let me export a conversation as Markdown"
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
          />
          <p className="numeric mt-1.5 text-right text-xs text-subtle-foreground">
            {title.length}/{TITLE_MAX}
          </p>
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground">
            What is missing, and why does it matter?
          </label>
          <textarea
            id="body"
            value={body}
            rows={8}
            maxLength={BODY_MAX}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Explain the problem, who it affects, and what you do today as a workaround."
            className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
          />
          <p className="numeric mt-1.5 text-right text-xs text-subtle-foreground">
            {body.length}/{BODY_MAX}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Submitting" : "Submit pitch"}
          </button>
          <p className="text-xs text-subtle-foreground">
            Posted anonymously. Reviewed before it goes public.
          </p>
        </div>
      </form>
    </div>
  );
}
