export class QueryBuilder<T = any> {
  private model: any;
  private query: Record<string, any>;
  private prismaQuery: any = {};

  constructor(model: any, query: Record<string, any>) {
    this.model = model;
    this.query = query;
  }

  // Search method
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      const orConditions = searchableFields.map((field) => {
        if (field.includes('.')) {
          const parts = field.split('.');
          return parts.reverse().reduce((acc, key, idx) => {
            if (idx === 0) {
              return { [key]: { contains: searchTerm, mode: 'insensitive' } };
            }
            return { [key]: acc };
          }, {});
        }

        return {
          [field]: { contains: searchTerm, mode: 'insensitive' },
        };
      });

      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: orConditions,
      };
    }
    return this;
  }

  // Filter method
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, any> = {};

    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === null || value === '') continue;

      if (key.includes('.')) {
        const parts = key.split('.');
        const nestedFilter = parts.reverse().reduce((acc, k, idx) => {
          if (idx === 0) {
            return { [k]: value };
          }
          return { [k]: acc };
        }, {});
        Object.assign(formattedFilters, nestedFilter);
      } else if (typeof value === 'string' && value.includes('[')) {
        const [field, operator] = key.split('[');
        const op = operator.slice(0, -1); // remove ]
        formattedFilters[field] = { [`${op}`]: parseFloat(value as string) };
      } else {
        let parsedValue: any = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
          parsedValue = Number(value);
        }

        formattedFilters[key] = parsedValue;
      }
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };

    return this;
  }

  // Raw Filter
  rawFilter(filters: Record<string, any>) {
    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...filters,
    };
    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(',') || ['-createdAt'];
    const orderBy = sort.map((field) => {
      if (field.startsWith('-')) {
        return { [field.slice(1)]: 'desc' };
      }
      return { [field]: 'asc' };
    });

    this.prismaQuery.orderBy = orderBy;
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }

  // Fields selection
  fields() {
    const fields = (this.query.fields as string)?.split(',') || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {},
      );
    }
    return this;
  }

  select(selectableFields: Record<string, boolean | object>) {
    this.prismaQuery.select = {
      ...this.prismaQuery.select,
      ...selectableFields,
    };
    return this;
  }

  // Include relation
  include(inculpableFields: Record<string, boolean | object>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...inculpableFields,
    };
    return this;
  }

  // Execute
  async execute(): Promise<T[]> {
    return this.model.findMany(this.prismaQuery);
  }

  // Count total
  async countTotal() {
    const total = await this.model.count({ where: this.prismaQuery.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPage,
    };
  }

  priceRange(minPrice?: number, maxPrice?: number) {
    if (!this.prismaQuery.where) {
      this.prismaQuery.where = {};
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      this.prismaQuery.where.price = {};

      if (minPrice !== undefined) {
        this.prismaQuery.where.price.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        this.prismaQuery.where.price.lte = maxPrice;
      }
    }

    return this;
  }
}
